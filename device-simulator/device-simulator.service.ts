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

import {Inject, Injectable} from "@angular/core";
import {DeviceSimulator, HOOK_SIMULATION_STRATEGY_FACTORY} from "./device-simulator";
import { InventoryService, MeasurementService, ApplicationService, IApplication, PagingStrategy, RealtimeAction} from "@c8y/client";
import {AppStateService, LoginService} from "@c8y/ngx-components";
import { Router } from '@angular/router';
import {LOCK_TIMEOUT, SimulationLockService} from './simulation-lock.service';
import { AppIdService } from '../app-id.service';
import {from, interval, merge, of, Subscription} from 'rxjs';
import {distinctUntilChanged, filter, first, flatMap, map, switchMap, tap, withLatestFrom} from "rxjs/operators";
import * as deepEqual from "fast-deep-equal";
import * as cloneDeep from "clone-deep";
import {SimulationStrategyFactory} from "./simulation-strategy";

export interface DeviceSimulatorInstance {
    id: number,
    type: string,
    instance: DeviceSimulator,
    deviceId: string
}

export interface SimulatorConfig<T=any> {
    id: number,
    name: string,
    type: string,
    config: T,
    started?: boolean
}

@Injectable({providedIn:"root"})
export class DeviceSimulatorService {
    readonly strategyFactoryByName: Map<string, SimulationStrategyFactory>;
    simulatorInstances: DeviceSimulatorInstance[] = [];
    simulatorConfigById = new Map<number, SimulatorConfig>();
    lockRefreshSubscription = new Subscription();
    private initialized = false;
    // @ts-ignore
    worker = new Worker('./simulator.worker.ts', {type: 'module'});

    constructor(
        @Inject(HOOK_SIMULATION_STRATEGY_FACTORY) simulationStrategyFactories: SimulationStrategyFactory[], private inventoryService: InventoryService,
        private appStateService: AppStateService, private appIdService: AppIdService, private measurementService: MeasurementService,
        private route: Router, private appService: ApplicationService, private simulatorLockService: SimulationLockService, private loginService: LoginService
    ) {
        this.strategyFactoryByName = new Map(simulationStrategyFactories.map(factory => [factory.getSimulatorMetadata().name, factory] as [string, SimulationStrategyFactory]));
    }

    initialize(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;

        // Set the worker's auth after the user logs in
        this.appStateService.currentUser.pipe(filter(user => user != null), first()).subscribe(() => {
            const token = localStorage.getItem(this.loginService.TOKEN_KEY) || sessionStorage.getItem(this.loginService.TOKEN_KEY);
            const tfa = localStorage.getItem(this.loginService.TFATOKEN_KEY) || sessionStorage.getItem(this.loginService.TFATOKEN_KEY);
            if (token) {
                const auth = {
                    token,
                    tfa
                };
                this.worker.postMessage({auth});
            }
        });

        // Listen for any of appId, simulatorConfig, or lockStatus changes and then reload or clear the simulators
        this.appIdService.appIdDelayedUntilAfterLogin$.pipe(
            switchMap(appId => {
                if (appId) {
                    const lockStatusChanges$ = this.simulatorLockService.lockStatus$(appId);

                    const simulatorConfigChanges$ = this.appService.list$({pageSize: 100, withTotalPages: true}, {
                        hot: true,
                        realtime: true,
                        pagingStrategy: PagingStrategy.ALL,
                        realtimeAction: RealtimeAction.FULL,
                        pagingDelay: 0
                    }).pipe(
                        flatMap(applications => from(applications)),
                        filter(application => application.id === appId),
                        map((application: IApplication & { applicationBuilder: any })  => application.applicationBuilder.simulators || []),
                        map(simulatorConfigs => cloneDeep(simulatorConfigs)), // The list$ command reuses existing objects so we want to clone to be able to detect differences
                        // Check to see if the simulator config has changed
                        distinctUntilChanged((prev, curr) => deepEqual(prev, curr))
                    );

                    return merge(
                        this.appIdService.appIdDelayedUntilAfterLogin$.pipe(
                            tap((appId) => { console.debug("AppID changed:", appId); })
                        ),
                        lockStatusChanges$.pipe(
                            tap((lockStatus) => { console.debug("Lock status changed:", lockStatus); })
                        ),
                        simulatorConfigChanges$.pipe(
                            tap((simulatorConfigs) => { console.debug("Simulator config changed:", simulatorConfigs); })
                        )
                    ).pipe(
                        withLatestFrom(lockStatusChanges$),
                        map(([_, lockStatus]) => ({appId, isLocked: lockStatus.isLocked, isLockOwned: lockStatus.isLockOwned}))
                    )
                } else {
                    // If there's no app id then we just say that it's locked and we don't own the lock....
                    return of({appId: undefined, isLocked: true, isLockOwned: false});
                }
            })
        ).subscribe(({appId, isLocked, isLockOwned}) => {
            this.lockRefreshSubscription.unsubscribe();
            if (appId == undefined) {
                console.debug("No appId: Clearing simulators");
                this.clearSimulators();
                this.simulatorConfigById.clear();
            } else {
                const simulatorConfigLoaded = this.loadSimulatorConfig(appId);
                if (isLockOwned) {
                    console.debug("Lock owned: Creating/Recreating simulators");
                    simulatorConfigLoaded.then(() => this.reloadSimulators());
                    // Refresh the lock every LOCK_TIMEOUT/2
                    this.lockRefreshSubscription = interval(LOCK_TIMEOUT/2).subscribe(() => this.simulatorLockService.refreshLock(appId))
                } else if (!isLocked) {
                    console.debug("Unlocked: Clearing simulators and attempting to take lock");
                    this.clearSimulators();
                    this.simulatorLockService.takeLock(appId); // After successfully taking the lock we'll get a lockStatus change so the simulators will be reloaded automatically
                } else {
                    console.debug("Locked: Clearing simulators");
                    this.clearSimulators();
                }
            }
        });
    }

    async loadSimulatorConfig(appId: string) {
        this.simulatorConfigById.clear();

        const app = (await this.appService.detail(appId)).data as IApplication & {applicationBuilder: any};
        if (app.applicationBuilder.simulators) {
            for (let simulatorConfig of app.applicationBuilder.simulators as SimulatorConfig[]) {
                this.simulatorConfigById.set(simulatorConfig.id, simulatorConfig);
            }
        }
    }

    async reloadSimulators() {
       this.clearSimulators();

       for (let simulatorConfig of this.simulatorConfigById.values()) {
           this.createInstance(simulatorConfig);
       }
    }

    clearSimulators() {
        this.simulatorInstances.forEach(simInstance => {
            if (simInstance.instance.isStarted()) {
                simInstance.instance.stop();
            }
        });
        this.simulatorInstances = [];
    }

    async changeSimulatorStarted(simulatorConfig: SimulatorConfig, started: boolean) {
        simulatorConfig.started = started;
        const appId = this.appIdService.getCurrentAppId();
        const app = (await this.appService.detail(appId)).data as IApplication & {applicationBuilder: {simulators?: SimulatorConfig[]}};
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
        // No need to do anything apart from update the simulator config - this automatically refreshes the simulators
    }

    async deleteSimulator(simulatorConfig: SimulatorConfig) {
        const appId = this.appIdService.getCurrentAppId();
        const app = (await this.appService.detail(appId)).data as IApplication & {applicationBuilder: {simulators?: SimulatorConfig[]}};
        if (app.applicationBuilder.simulators != undefined) {
            app.applicationBuilder.simulators = app.applicationBuilder.simulators.filter(currentSimConfig => currentSimConfig.id !== simulatorConfig.id);
        }
        await this.appService.update({
            id: appId,
            applicationBuilder: app.applicationBuilder
        } as IApplication);
        // No need to do anything apart from update the simulator config - this automatically refreshes the simulators
    }

    createInstance(simulatorConfig: SimulatorConfig): DeviceSimulator | undefined {
        if (!simulatorConfig.started){
            return undefined;
        }

        const strategyFactory = this.strategyFactoryByName.get(simulatorConfig.type);
        if (!strategyFactory) {
            throw new Error(`Could not find Simulator Strategy: ${simulatorConfig.type}`);
        }

        const instance = strategyFactory.createInstance(simulatorConfig);
        this.simulatorInstances.push({
            id: simulatorConfig.id,
            type: simulatorConfig.type,
            instance,
            deviceId: simulatorConfig.config.deviceId
        });
        instance.start();
        return instance;
    }

}
