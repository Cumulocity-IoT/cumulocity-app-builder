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

import {Inject, Injectable, Type} from "@angular/core";
import {DeviceSimulator, HOOK_SIMULATION_STRATEGY} from "./device-simulator";
import {DeviceHandle} from "./device-handle";
import {SimulationStrategyMetadata} from "./simulation-strategy.decorator";
import { InventoryService, MeasurementService, ApplicationService, IApplication, PagingStrategy, RealtimeAction} from "@c8y/client";
import {AppStateService} from "@c8y/ngx-components";
import { Router } from '@angular/router';
import { SimulationLockService } from './simulation-lock.service';
import { AppIdService } from '../app-id.service';
import {combineLatest, from, merge, NEVER} from 'rxjs';
import {distinctUntilChanged, filter, flatMap, mapTo, switchMap, withLatestFrom} from "rxjs/operators";
import * as deepEqual from "fast-deep-equal";

export interface DeviceSimulatorStrategy {
    name: string,
    icon: string,
    description?: string,
    simulatorClass: Type<DeviceSimulator>
}

export interface DeviceSimulatorInstance extends DeviceSimulatorStrategy {
    id: number,
    instance: DeviceSimulator,
    deviceId: string
}

@Injectable({providedIn:"root"})
export class DeviceSimulatorService {
    readonly strategiesByName: Map<string, DeviceSimulatorStrategy>;
    simulatorInstances: DeviceSimulatorInstance[] = [];
    constructor(
        @Inject(HOOK_SIMULATION_STRATEGY) simulationStrategies: Type<DeviceSimulator>[], private inventoryService: InventoryService,
        private appStateService: AppStateService, private appIdService: AppIdService, private measurementService: MeasurementService,
        private route: Router, private appService: ApplicationService, private simulatorLockService: SimulationLockService
    ) {
        const strategies = simulationStrategies.map(simulatorClass => {
            const metadata: SimulationStrategyMetadata = Reflect.getMetadata('simulationStrategy', simulatorClass)[0];
            return {
                name: metadata.name,
                icon: metadata.icon,
                description: metadata.description,
                configComponent: metadata.configComponent,
                simulatorClass
            }
        });

        this.strategiesByName = new Map(strategies.map(strat => [strat.name, strat] as [string, DeviceSimulatorStrategy]));

        const lockStatusOrAppIdChanges$ = combineLatest(
            appIdService.appIdDelayedUntilAfterLogin$,
            simulatorLockService.lockStatus$
        );

        const simulatorConfigChanges$ = appIdService.appIdDelayedUntilAfterLogin$.pipe(
            switchMap((appId) => {
                if (appId) {
                    return this.appService.list$({pageSize: 100, withTotalPages: true}, {
                        hot: true,
                        realtime: true,
                        pagingStrategy: PagingStrategy.ALL,
                        realtimeAction: RealtimeAction.FULL,
                        pagingDelay: 0
                    }).pipe(
                        flatMap(applications => from(applications)),
                        filter(application => application.id === appId),
                        // Check to see if the simulator config has changed
                        distinctUntilChanged((prev: IApplication & { applicationBuilder?: any }, curr: IApplication & { applicationBuilder?: any }) => {
                            return deepEqual(prev.applicationBuilder != undefined ? prev.applicationBuilder.simulators : [], curr.applicationBuilder != undefined ? curr.applicationBuilder.simulators : []);
                        }),
                        mapTo(appId)
                    );
                } else {
                    return NEVER;
                }
            }),
            withLatestFrom(simulatorLockService.lockStatus$)
        );

        // If any of the appId, the simulatorConfig, or the lockStatus change then we need to reload or clear the simulators
        merge(lockStatusOrAppIdChanges$, simulatorConfigChanges$).subscribe(([appId, {isLocked, isLockOwned, lockStatus}]) => {
            if (appId == undefined) {
                this.clearSimulators()
            } else {
                if (isLockOwned) {
                    this.reloadSimulators(appId);
                } else if (!isLocked) {
                    this.clearSimulators();
                    this.simulatorLockService.takeLock(); // After successfully taking the lock we'll get a lockStatus change so the simulators will be reloaded automatically
                } else {
                    this.clearSimulators();
                }
            }
        });
    }
    
    /**
     * Reload simulators on page refresh/load
     */
    async reloadSimulators(appId: string) {
       this.clearSimulators();

        const app = (await this.appService.detail(appId)).data as IApplication & {applicationBuilder: any};
        if(app.applicationBuilder && app.applicationBuilder.simulators){
            app.applicationBuilder.simulators.forEach(simulatorConfig => {
                this.createInstance(simulatorConfig);
            });
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


    /**
     *
     * Create simulator instances and store it in object.
     * Also start simulator if simulator start flag is true
     * @param {*} simulatorConfig
     * @returns {DeviceSimulator}
     * @memberof DeviceSimulatorService
     */
    createInstance(simulatorConfig: any): DeviceSimulator {
        const deviceHandle = new DeviceHandle(this.inventoryService, this.measurementService,
            simulatorConfig, this.appService, this.appIdService.getCurrentAppId(), this.appStateService.currentUser, this.simulatorLockService);

        const strategy = this.strategiesByName.get(simulatorConfig.type);
        if (!strategy) {
            throw new Error(`Could not find Simulator Strategy: ${simulatorConfig.type}`);
        }

        const instance = new strategy.simulatorClass(simulatorConfig.name, simulatorConfig.config, deviceHandle);
         this.simulatorInstances.push(
            Object.assign({},
            strategy,
            {
                id: simulatorConfig.id,
                instance,
                deviceId: simulatorConfig.config.deviceId,
           }));
        if (simulatorConfig.config.isSimulatorStarted){
            instance.start();
        }
        return instance;
    }

}