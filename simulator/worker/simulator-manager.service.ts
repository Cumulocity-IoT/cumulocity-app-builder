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

import {ApplicationService, IApplication, PagingStrategy, RealtimeAction} from "@c8y/client";
import {DeviceSimulator} from "../device-simulator";
import {SimulatorConfig} from "../simulator-config";
import {SimulatorWorkerAPI} from "./simulator-worker-api.service";
import {AppIdService} from "../../app-id.service";
import {LOCK_TIMEOUT, SimulationLockService} from "./simulation-lock.service";
import {switchMap, flatMap, map, filter, distinctUntilChanged, tap, withLatestFrom} from "rxjs/operators";
import {from, interval, merge, of, Subscription} from "rxjs";
import * as deepEqual from "fast-deep-equal";
import * as cloneDeep from "clone-deep";
import {SimulationStrategiesService} from "../simulation-strategies.service";
import {Injectable} from "@angular/core";

export interface DeviceSimulatorInstance {
    id: number,
    type: string,
    instance: DeviceSimulator,
    deviceId: string
}

@Injectable()
export class SimulatorManagerService {
    simulatorInstances: DeviceSimulatorInstance[] = [];
    simulatorConfigById = new Map<number, SimulatorConfig>();

    private lockRefreshSubscription = new Subscription();

    constructor(
        private simulatorWorkerAPI: SimulatorWorkerAPI, private appService: ApplicationService,
        private appIdService: AppIdService, private lockService: SimulationLockService,
        private simulationStrategiesService: SimulationStrategiesService
    ) {}

    initialize() {
        const appIdLockOrConfigChange = this.appIdService.appIdDelayedUntilAfterLogin$.pipe(
            switchMap(appId => {
                if (appId) {
                    const lockStatusChanges$ = this.lockService.lockStatus$(appId);

                    const simulatorConfigChanges$ = from(this.appService.list$({pageSize: 100, withTotalPages: true}, {
                        hot: true,
                        realtime: true,
                        pagingStrategy: PagingStrategy.ALL,
                        realtimeAction: RealtimeAction.FULL,
                        pagingDelay: 0
                    })).pipe(
                        flatMap(applications => from(applications)),
                        filter(application => application.id === appId),
                        map((application: IApplication & { applicationBuilder: any })  => application.applicationBuilder.simulators || []),
                        map(simulatorConfigs => cloneDeep(simulatorConfigs)), // The list$ command reuses existing objects so we want to clone to be able to detect differences
                        // Check to see if the simulator config has changed
                        distinctUntilChanged((prev, curr) => deepEqual(prev, curr))
                    );

                    return merge(
                        of(appId).pipe(
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
        );

        // Listen for any of appId, simulatorConfig, or lockStatus changes and then reload or clear the simulators
        appIdLockOrConfigChange.subscribe(({appId, isLocked, isLockOwned}) => {
            this.lockRefreshSubscription.unsubscribe();
            if (appId == undefined) {
                console.debug("No appId: Clearing simulators");
                this.clearSimulators();
                this.simulatorConfigById.clear();
                this.simulatorWorkerAPI._simulatorConfig$.next(this.simulatorConfigById);
            } else {
                const simulatorConfigLoaded = this.loadSimulatorConfig(appId);
                if (isLockOwned) {
                    console.debug("Lock owned: Creating/Recreating simulators");
                    simulatorConfigLoaded.then(() => this.reloadSimulators());
                    // Refresh the lock every LOCK_TIMEOUT/2
                    this.lockRefreshSubscription = interval(LOCK_TIMEOUT/2).subscribe(() => this.lockService.refreshLock(appId))
                } else if (!isLocked) {
                    console.debug("Unlocked: Clearing simulators and attempting to take lock");
                    this.clearSimulators();
                    this.lockService.takeLock(appId); // After successfully taking the lock we'll get a lockStatus change so the simulators will be reloaded automatically
                } else {
                    console.debug("Locked: Clearing simulators");
                    this.clearSimulators();
                }
            }
        });

        this.appIdService.appIdDelayedUntilAfterLogin$.pipe(switchMap((appId: string | undefined) => {
            if (appId) {
                return this.lockService.lockStatus$(appId);
            } else {
                return of({isLocked: false, isLockOwned: false});
            }
        })).subscribe(lockStatus => {
            this.simulatorWorkerAPI._lockStatus$.next(lockStatus);
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
        this.simulatorWorkerAPI._simulatorConfig$.next(this.simulatorConfigById);
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

    createInstance(simulatorConfig: SimulatorConfig): DeviceSimulator | undefined {
        if (!simulatorConfig.started){
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
        return instance;
    }

}
