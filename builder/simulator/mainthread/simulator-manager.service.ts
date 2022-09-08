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

import { ApplicationService, IApplication, IOperation } from "@c8y/client";
import { DeviceSimulator } from "../device-simulator";
import { SimulatorConfig } from "../simulator-config";
import { SimulatorWorkerAPI } from "./simulator-worker-api.service";
import { AppIdService } from "../../app-id.service";
import { LOCK_TIMEOUT, SimulationLockService } from "./simulation-lock.service";
import {
    switchMap,
    map,
    distinctUntilChanged,
    tap,
    withLatestFrom,
    debounceTime
} from "rxjs/operators";
import { from, interval, merge, Observable, of, Subscription } from "rxjs";
import * as deepEqual from "fast-deep-equal";
import { SimulationStrategiesService } from "../simulation-strategies.service";
import { Injectable } from "@angular/core";
import { AppDataService } from "./../../app-data.service";

export interface DeviceSimulatorInstance {
    id: number,
    type: string,
    instance: DeviceSimulator,
    deviceId: string;
}

/**
 * Manages the lifecycle of the simulators
 */
@Injectable({providedIn: 'root'})
export class SimulatorManagerService {
    simulatorInstances: DeviceSimulatorInstance[] = [];
    simulatorConfigById = new Map<number, SimulatorConfig>();
    operations$: Observable<any[]>;

    private lockRefreshSubscription = new Subscription();

    constructor(
        private simulatorWorkerAPI: SimulatorWorkerAPI, private appService: ApplicationService,
        private appIdService: AppIdService, private lockService: SimulationLockService,
        private simulationStrategiesService: SimulationStrategiesService,
        private appDataService: AppDataService
    ) { }

    initialize() {
        const appIdLockOrConfigChange = this.appIdService.appIdDelayedUntilAfterLogin$.pipe(
            switchMap(appId => {
                if (appId) {
                    const lockStatusChanges$ = this.lockService.lockStatus$(appId);

                    const simulatorConfigChanges$ = merge(
                        of(-1), // Check the current value immediately
                        interval(30000), // Check every 30 seconds
                        this.simulatorWorkerAPI._checkForSimulatorConfigChanges // Check if asked to
                    ).pipe(
                        debounceTime(100),
                        //switchMap(() => from(this.appDataService.getAppDetails(appId))),
                        switchMap(() => this.appService.detail(appId)),
                        map(res => res.data),
                        map((application: IApplication & { applicationBuilder: any; }) => application.applicationBuilder.simulators || []),
                        // Check to see if the simulator config has changed
                        distinctUntilChanged((prev, curr) => deepEqual(prev, curr))
                    );

                    return merge(
                        of(appId).pipe(
                            tap((appId) => { //console.debug("AppID changed:", appId); 
                            })
                        ),
                        lockStatusChanges$.pipe(
                            tap((lockStatus) => { //console.debug("Lock status changed:", lockStatus); 
                            })
                        ),
                        simulatorConfigChanges$.pipe(
                            tap((simulatorConfigs) => { //console.debug("Simulator config changed:", simulatorConfigs); 
                            })
                        )
                    ).pipe(
                        withLatestFrom(lockStatusChanges$),
                        map(([_, lockStatus]) => ({ appId, isLocked: lockStatus.isLocked, isLockOwned: lockStatus.isLockOwned }))
                    );
                } else {
                    // If there's no app id then we just say that it's locked and we don't own the lock....
                    return of({ appId: undefined, isLocked: true, isLockOwned: false });
                }
            })
        );

        // Listen for any of appId, simulatorConfig, or lockStatus changes and then reload or clear the simulators
        appIdLockOrConfigChange.subscribe(({ appId, isLocked, isLockOwned }) => {
            this.lockRefreshSubscription.unsubscribe();
            if (appId == undefined) {
                // console.debug("No appId: Clearing simulators");
                this.clearSimulators();
                this.simulatorConfigById.clear();
                this.simulatorWorkerAPI._simulatorConfig$.next(this.simulatorConfigById);
            } else {
                const simulatorConfigLoaded = this.loadSimulatorConfig(appId);
                if (isLockOwned) {
                    // console.debug("Lock owned: Creating/Recreating simulators");
                    simulatorConfigLoaded.then(() => this.reloadSimulators());
                    // Refresh the lock every LOCK_TIMEOUT/2
                    this.lockRefreshSubscription = interval(LOCK_TIMEOUT / 2).subscribe(() => this.lockService.refreshLock(appId));
                } else if (!isLocked) {
                    // console.debug("Unlocked: Clearing simulators and attempting to take lock");
                    this.clearSimulators();
                    this.lockService.takeLock(appId); // After successfully taking the lock we'll get a lockStatus change so the simulators will be reloaded automatically
                } else {
                    //  console.debug("Locked: Clearing simulators");
                    this.clearSimulators();
                }
            }
        });

        this.appIdService.appIdDelayedUntilAfterLogin$.pipe(switchMap((appId: string | undefined) => {
            if (appId) {
                return this.lockService.lockStatus$(appId);
            } else {
                return of({ isLocked: false, isLockOwned: false });
            }
        })).subscribe(lockStatus => {
            this.simulatorWorkerAPI._lockStatus$.next(lockStatus);
        });

        //
        // make sure we only ping the simulators when there is new data
        //
        this.operations$ = this.simulatorWorkerAPI._incomingOperations.pipe(
            distinctUntilChanged((prev, curr) => deepEqual(prev, curr))
        );

    }

    async loadSimulatorConfig(appId: string) {
        const app = (await this.appService.detail(appId)).data as IApplication & { applicationBuilder: any; };
        this.simulatorConfigById.clear();
        if (app.applicationBuilder.simulators) {
            const sortedSimulators = app.applicationBuilder.simulators.sort((a, b) => a.name > b.name ? 1 : -1);
            for (let simulatorConfig of sortedSimulators as SimulatorConfig[]) {
                this.simulatorConfigById.set(simulatorConfig.id, simulatorConfig);
            }
        }
        this.simulatorWorkerAPI._simulatorConfig$.next(this.simulatorConfigById);
    }

    async reloadSimulators() {
        this.clearSimulators();

        let turnOn = false;
        for (let simulatorConfig of Array.from(this.simulatorConfigById.values())) {
            this.createInstance(simulatorConfig);
            if( simulatorConfig.type == "DTDL"){
                for (let dtdlConfig of Array.from(simulatorConfig.config.dtdlModelConfig)) {
                    if( dtdlConfig.alternateConfigs && dtdlConfig.alternateConfigs.hasOwnProperty("opEnabled") && dtdlConfig.alternateConfigs.opEnabled) {
                        turnOn = true;
                    }        
                }
            } else {
                if( simulatorConfig.config.alternateConfigs && simulatorConfig.config.alternateConfigs.hasOwnProperty("opEnabled") && simulatorConfig.config.alternateConfigs.opEnabled) {
                    turnOn = true;
                }    
            }
        }
        this.simulatorWorkerAPI.retrieveOperations = turnOn;
    }

    clearSimulators() {
        this.simulatorInstances.forEach(simInstance => {
            if (simInstance.instance.isStarted()) {
                simInstance.instance.stop(); //handles unsub
            }
        });
        this.simulatorInstances = [];
    }

    createInstance(simulatorConfig: SimulatorConfig): DeviceSimulator | undefined {
        if (!simulatorConfig.started || simulatorConfig.serverSide) {
            return undefined;
        }

        const strategyFactory = this.simulationStrategiesService.strategiesByName.get(simulatorConfig.type);
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

        // now connect the simulator to the operations observable
        // it handles unsub
        instance.subscribeToOperations(this.operations$);
        return instance;
    }
}
