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

import {Component} from '@angular/core';
import {
    DeviceSimulatorService,
    SimulatorConfig
} from "../device-simulator/device-simulator.service";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {NewSimulatorModalComponent} from "./new-simulator-modal.component";
import {EditSimulatorModalComponent} from "./edit-simulator-modal.component";
import {InventoryService} from '@c8y/client';
import {LOCK_TIMEOUT, LockStatus, SimulationLockService} from "../device-simulator/simulation-lock.service";
import {AppIdService} from "../app-id.service";
import {switchMap} from "rxjs/operators";
import {Observable} from "rxjs";
import * as delay from "delay";

@Component({
    templateUrl: './device-simulator-config.component.html'
})
export class DeviceSimulatorConfigComponent {
    bsModalRef: BsModalRef;

    lockStatus$: Observable<{isLocked: boolean, isLockOwned: boolean, lockStatus: LockStatus}>;

    isUnlocking = false;

    constructor(private simulatorLockService: SimulationLockService, private deviceSimulatorSvc: DeviceSimulatorService, private modalService: BsModalService, private inventoryService: InventoryService, private appIdService: AppIdService) {
        this.lockStatus$ = appIdService.appIdDelayedUntilAfterLogin$
            .pipe(switchMap(appId => simulatorLockService.lockStatus$(appId)));
    }

    showCreateSimulatorDialog() {
        this.bsModalRef = this.modalService.show(NewSimulatorModalComponent, { class: 'c8y-wizard' });
    }

    async showEditSimulatorDialog(simulatorConfig: SimulatorConfig) {
        this.bsModalRef = this.modalService.show(EditSimulatorModalComponent, { class: 'c8y-wizard', initialState: { simulatorConfig } })
    }

    async forceUnlock() {
        this.isUnlocking = true;
        await this.simulatorLockService.forceTakeLock(this.appIdService.getCurrentAppId());
        // Wait a bit extra to allow the UI to realise that we now own the lock
        await delay(LOCK_TIMEOUT/2);
        this.isUnlocking = false;
    }
}