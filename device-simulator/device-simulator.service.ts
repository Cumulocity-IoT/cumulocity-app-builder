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
import {InventoryService, MeasurementService, ApplicationService} from "@c8y/client";
import {AppStateService, NavigatorNodeFactory} from "@c8y/ngx-components";
import {filter, first, mapTo, map} from "rxjs/operators";
import { Router, ActivationEnd, NavigationEnd } from '@angular/router';

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
export class DeviceSimulatorService implements NavigatorNodeFactory {
    readonly strategiesByName: Map<string, DeviceSimulatorStrategy>;
    simulatorInstances: DeviceSimulatorInstance[] = [];
    currentAppID : string | undefined;
    currentUserDetails:any;
    constructor(@Inject(HOOK_SIMULATION_STRATEGY) simulationStrategies: Type<DeviceSimulator>[], private inventoryService: InventoryService, 
        private appStateService: AppStateService, private measurementService: MeasurementService,
        private route: Router, private appService: ApplicationService) {
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
        
        // Wait for the user to log in and then reload the simulators
        appStateService.currentUser
            .pipe(
                filter(user => user != null),
                first()

            )
            .toPromise()
            .then((user) => {
                this.currentUserDetails = user;
                this.reloadSimulators()
            });

        this.route.events.pipe(
            filter(event => event instanceof ActivationEnd),
            map((event: ActivationEnd) => event.snapshot.url),
            map(url => {
                console.log('event registered');
                if (url.length >= 2 && url[0].path === 'application') {
                    return url[1].path;
                } else {
                    return undefined;
                }
            }),

        ).subscribe(appId => {
            // console.log('app Id' + app);
            this.currentAppID = appId;
        });
    }
    get(){
        return null;
    }
    setCurrentAppId(appId){
        this.currentAppID = appId;
    }
    getCurrentAppId() {
        return this.currentAppID;
    }
    async reloadSimulators() {
        this.simulatorInstances.forEach(simInstance => {
            if (simInstance.instance.isStarted()) {
                simInstance.instance.stop();
            }
        });
        this.simulatorInstances = [];

        // const simulatedDevices = (await this.inventoryService.list({ pageSize: 2000, query: 'has(simulators)' })).data;
        const appServiceObj = (await this.appService.detail(this.currentAppID)).data as any;
        const simulatedObject = appServiceObj.applicationBuilder.simulators;
        if(simulatedObject){
           /*  simulatedObject.forEach(simulatorConfig => {
                this.createInstance(simulatorConfig.id, simulatorConfig.type, simulatorConfig.name, simulatorConfig.config.deviceId, simulatorConfig.config);
            }); */
            simulatedObject.forEach(simulatorConfig => {
                this.createInstance(simulatorConfig, appServiceObj.applicationBuilder.simulatorsLock);
            });
        }
      
       /*  simulatedDevices.forEach(device => {
            device.simulators.forEach(simulatorConfig => {
                this.createInstance(simulatorConfig.id, simulatorConfig.type, simulatorConfig.name, device.id, simulatorConfig.config);
            });
        }); */
    }

    // createInstance(id: number, strategyName: string, instanceName: string, deviceId: string, config: any): DeviceSimulator {
    createInstance(simulatorConfig: any, simulatorLock: any): DeviceSimulator {
        const deviceHandle = new DeviceHandle(this.inventoryService, this.measurementService, 
            simulatorConfig, this.appService, this.currentAppID, this.currentUserDetails);

        const strategy = this.strategiesByName.get(simulatorConfig.type);
        if (!strategy) {
            throw new Error(`Could not find Simulator Strategy: ${simulatorConfig.type}`);
        }

        const instance = new strategy.simulatorClass(simulatorConfig.name, simulatorConfig.config, deviceHandle);
        let isLocked = false;
        if (simulatorLock){
            isLocked = (simulatorLock.isLocked && simulatorLock.lockedBy !== this.currentUserDetails.id);
        }
         this.simulatorInstances.push(
            Object.assign({}, 
            strategy, 
            { 
                id: simulatorConfig.id, 
                instance, 
                deviceId: simulatorConfig.config.deviceId,
                isLocked: isLocked,
                lockedBy: (isLocked ? simulatorLock.lockedDisplayName : ''),
                lockedOn: (isLocked ? simulatorLock.lockedOn : '')
            }));
        if (simulatorConfig.config.isSimulatorStarted && isLocked && simulatorLock.lockedBy === this.currentUserDetails.id){
            instance.start();
        }
        return instance;
    }

    async deleteInstance(simulator: DeviceSimulatorInstance) {
        if (simulator.instance.isStarted()) {
            simulator.instance.stop();
        }
        this.simulatorInstances = this.simulatorInstances.filter(x => x.id !== simulator.id);

        let appServiceData  = (await this.appService.detail(this.currentAppID)).data as any ;
        const simulators = appServiceData.applicationBuilder.simulators
            .filter(x => x.id !== simulator.id);
        
        appServiceData.applicationBuilder.simulators = simulators.length > 0 ? simulators : null
       
        await this.appService.update({
            id: this.currentAppID,
            applicationBuilder: appServiceData.applicationBuilder
        } as any);
    }
}