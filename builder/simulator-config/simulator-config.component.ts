/*
* Copyright (c) 2019 Software AG, Darmstadt, Germany and/or its licensors
*
* SPDX-License-Identifier: Apache-2.0
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
 */

import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { NewSimulatorModalComponent } from "./new-simulator-modal.component";
import { EditSimulatorModalComponent } from "./edit-simulator-modal.component";
import { BehaviorSubject, from, of, Subscription } from "rxjs";
import { switchMap} from "rxjs/operators";
import * as delay from "delay";
import { IApplication, ApplicationService, UserService } from "@c8y/client";
import { AppIdService } from "../app-id.service";
import { SimulatorConfig } from "../simulator/simulator-config";
import { SimulatorCommunicationService } from "../simulator/mainthread/simulator-communication.service";
import { SimulationStrategiesService } from "../simulator/simulation-strategies.service";
import { AppStateService } from '@c8y/ngx-components';
import * as cloneDeep from "clone-deep";
import { SimulatorNotificationService } from './simulatorNotification.service';
import { DOCUMENT } from '@angular/common';
import { FileSimulatorNotificationService } from './file-simulator.service';
import { SimulatorWorkerAPI } from '../simulator/mainthread/simulator-worker-api.service';
import { AppDataService } from './../../builder/app-data.service';
import { LockStatus, LOCK_TIMEOUT } from './../../builder/simulator/mainthread/simulation-lock.service';
@Component({
    templateUrl: './simulator-config.component.html',
    styleUrls: ['./simulator-config.component.less']
})
export class SimulatorConfigComponent implements OnDestroy {
    bsModalRef: BsModalRef;

    lockStatus$ = new BehaviorSubject<{ isLocked: boolean, isLockOwned: boolean, lockStatus?: LockStatus }>({ isLocked: false, isLockOwned: false });
    simulatorConfigById$ = new BehaviorSubject<Map<number, SimulatorConfig>>(new Map());

    isUnlocking = false;
    applyTheme = false;
    private _lockStatusListener: number;
    private _simulatorConfigListener: number;
    userHasAdminRights: boolean;
    isSimulatorsExist: boolean = false;
    appSubscription: Subscription;
    constructor(
        private simSvc: SimulatorWorkerAPI, private modalService: BsModalService,
        private appIdService: AppIdService, private appService: ApplicationService,
        public simulationStrategiesService: SimulationStrategiesService,
        private appStateService: AppStateService, private userService: UserService,
        private simulatorNotificationService: SimulatorNotificationService,
        @Inject(DOCUMENT) private document: Document, private renderer: Renderer2,
        private fileSimulatorNotificationService: FileSimulatorNotificationService,
        private appDataService: AppDataService
    ) {
        this._lockStatusListener = simSvc.addLockStatusListener(lockStatus => this.lockStatus$.next(lockStatus));
        this._simulatorConfigListener = simSvc.addSimulatorConfigListener(simulatorConfigById =>
            this.simulatorConfigById$.next(simulatorConfigById));
        this.userHasAdminRights = userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN", "ROLE_APPLICATION_MANAGEMENT_ADMIN"]);
        const app = this.appIdService.appIdDelayedUntilAfterLogin$.pipe(
            switchMap(appId =>  {
                if (appId) {
                return from(this.appDataService.getAppDetails(appId));
                } else {
                return of(null);
                }
            })
        );
        this.appSubscription = app.subscribe((app) => {
            if (app && app.applicationBuilder.branding.enabled && (app.applicationBuilder.selectedTheme && app.applicationBuilder.selectedTheme !== 'Default')) {
                this.applyTheme = true;
                this.renderer.addClass(this.document.body, 'simulator-body-theme');
            } else {
                this.applyTheme = false;
            }
            if(app.applicationBuilder && app.applicationBuilder?.simulators && app.applicationBuilder?.simulators.length > 0){
                this.isSimulatorsExist = true;
            }
        });
    }

    showCreateSimulatorDialog() {
        this.bsModalRef = this.modalService.show(NewSimulatorModalComponent, { backdrop: 'static', class: 'c8y-wizard' });
    }

    async showEditSimulatorDialog(simulatorConfig: SimulatorConfig) {
        const copySimulatorConfig = cloneDeep(simulatorConfig);
        this.bsModalRef = this.modalService.show(EditSimulatorModalComponent,
            { backdrop: 'static', class: (simulatorConfig.config.modalSize ? simulatorConfig.config.modalSize : 'c8y-wizard'), initialState: { simulatorConfig: copySimulatorConfig } })

    }

    public exportSimulatorConfig(simulatorConfig: SimulatorConfig) {
        const configBlob = new Blob([JSON.stringify(simulatorConfig)], { type: 'text/plain' });
        const url = window.URL.createObjectURL(configBlob);
        let a = document.createElement('a');
        document.body.appendChild(a);
        a.setAttribute('style', 'display: none');
        a.href = url;
        a.download = simulatorConfig.name + "-config.json";
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }

    async forceUnlock() {
        this.isUnlocking = true;
        await this.simSvc.forceTakeLock();
        // Wait a bit extra to allow the UI to realise that we now own the lock
        await delay(LOCK_TIMEOUT / 2);
        this.isUnlocking = false;
    }

    async changeSimulatorStarted(simulatorConfig: SimulatorConfig, started: boolean) {
        simulatorConfig.started = started;
        simulatorConfig.lastUpdated = new Date().toISOString();
        const appId = this.appIdService.getCurrentAppId();
        const app = (await this.appService.detail(appId)).data as IApplication & { applicationBuilder: { simulators?: SimulatorConfig[] } };
        if (app.applicationBuilder.simulators != undefined) {
            const matchingIndex = app.applicationBuilder.simulators.findIndex(currentSimConfig => currentSimConfig.id === simulatorConfig.id);
            if (matchingIndex > -1) {
                app.applicationBuilder.simulators[matchingIndex] = simulatorConfig;
            }
        }
        await this.appService.update({
            id: appId,
            applicationBuilder: app.applicationBuilder
        } as IApplication);

        if (simulatorConfig && simulatorConfig.type && simulatorConfig.type.includes('File (CSV/JSON)')) {
            this.fileSimulatorNotificationService.post({
                id: app.id,
                name: app.name,
                tenant: (app.owner && app.owner.tenant && app.owner.tenant.id ? app.owner.tenant.id : ''),
                type: app.type,
                simulator: simulatorConfig
            })
        } else {
            this.simulatorNotificationService.post({
                id: appId,
                name: app.name,
                tenant: (app.owner && app.owner.tenant && app.owner.tenant.id ? app.owner.tenant.id : ''),
                type: app.type,
                simulator: simulatorConfig
            });
        }
        // We could just wait for them to refresh, but it's nicer to instantly refresh
        await this.simSvc.checkForSimulatorConfigChanges();
    }

    async deleteSimulator(simulatorConfig: SimulatorConfig) {
        const appId = this.appIdService.getCurrentAppId();
        const app = (await this.appService.detail(appId)).data as IApplication & { applicationBuilder: { simulators?: SimulatorConfig[] } };
        if (app.applicationBuilder.simulators != undefined) {
            app.applicationBuilder.simulators = app.applicationBuilder.simulators.filter(currentSimConfig => currentSimConfig.id !== simulatorConfig.id);
        }
        await this.appService.update({
            id: appId,
            applicationBuilder: app.applicationBuilder
        } as IApplication);

        this.simulatorNotificationService.remove({
            id: appId,
            name: app.name,
            tenant: (app.owner && app.owner.tenant && app.owner.tenant.id ? app.owner.tenant.id : ''),
            type: app.type,
            simulator: simulatorConfig
        });
        // We could just wait for them to refresh, but it's nicer to instantly refresh
       // await this.simSvc.checkForSimulatorConfigChanges();
    }

    ngOnDestroy(): void {
        this.simSvc.removeListener(this._lockStatusListener);
        this.simSvc.removeListener(this._simulatorConfigListener);
        this.renderer.removeClass(this.document.body, 'simulator-body-theme');
        this.appSubscription.unsubscribe();
    }

    // for keyValue pipe
    unsorted() { }
}
