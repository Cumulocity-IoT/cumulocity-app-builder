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
import { InventoryService, MeasurementService, ApplicationService, PagingStrategy, RealtimeAction} from "@c8y/client";
import {AppStateService, NavigatorNodeFactory} from "@c8y/ngx-components";
import {filter, first, mapTo, map, switchMap, tap} from "rxjs/operators";
import { Router, ActivationEnd, NavigationEnd } from '@angular/router';
import { SimulationLockService } from './simulation-lock-service';
import { AppIdService } from '../app-id.service';
import { from, of } from 'rxjs';

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
    intervalLockTracker : any;
    lockTrackerInterval = 5000;
    appServiceLiveData : any;
    simulatorLockTrackerLiveData : any;
    isActiveSession = false;
    isLocked = this.checkLocked();
    constructor(@Inject(HOOK_SIMULATION_STRATEGY) simulationStrategies: Type<DeviceSimulator>[], private inventoryService: InventoryService, 
        private appStateService: AppStateService, private appIdService: AppIdService, private measurementService: MeasurementService,
        private route: Router, private appService: ApplicationService, private simulatorLockService: SimulationLockService) {
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
        // Subscribed AppID Service. Wait to get login completed and appId avaialbe via route event
        appIdService.appIdDelayedUntilAfterLogin$.pipe(switchMap(appId => {
            if (appId != undefined) {
                this.currentAppID = appId;
                const query = {
                    applicationId: appId
                }
                // Get current User and reload simulators when available
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

                // get Application Object for given App ID
                // Used in next step for realtime updates
                this.inventoryService.listQuery(query).
                then((lockTracker : any) => {
                    if (lockTracker.data.length > 0) {
                        this.inventoryService.detail$(lockTracker.data[0].id, {
                            hot: true,
                            realtime: true
                        }).subscribe(lockTracker => {
                            this.simulatorLockTrackerLiveData = lockTracker;
                            this.isLocked = this.checkLocked();
                           // console.log(lockTracker);
                        });
                    }
                });

                // appService list for realTime updates in simulators
                return from(this.appService.list$({ pageSize: 100, withTotalPages: true }, {
                    hot: true,
                    realtime: true,
                    pagingStrategy: PagingStrategy.ALL,
                    realtimeAction: RealtimeAction.FULL,
                    pagingDelay: 0.1
                }));
             } else {
                    return of(undefined);
                }
            })).
            subscribe(async appServices => {
                if (appServices == undefined) {
                    return;
                }
                let appServiceData = appServices.filter(x => x.id === this.currentAppID);
                this.appServiceLiveData = appServiceData[0];
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

    
    /**
     * Check if simulators are locked or not
     *
     * @returns
     * @memberof DeviceSimulatorService
     */
    checkLocked(){
        this.isActiveSession = this.simulatorLockService.isActiveSession();
        if (this.simulatorLockTrackerLiveData)
            return (!this.isActiveSession && this.simulatorLockTrackerLiveData.simulatorsLock.isLocked);
        else 
            return false;
    }

    
   /**
    * Reload simulators on page refresh/load
    *
    * @memberof DeviceSimulatorService
    */
   async reloadSimulators() {
        this.simulatorInstances.forEach(simInstance => {
            if (simInstance.instance.isStarted()) {
                simInstance.instance.stop();
            }
        });
        this.simulatorInstances = [];

        this.intervalLockTracker = setInterval(() => this.updateLockTracker(), this.lockTrackerInterval);
        let appServiceObj = this.appServiceLiveData; // (await this.appService.detail(this.currentAppID)).data as any;
        if (!this.appServiceLiveData)
            appServiceObj = (await this.appService.detail(this.currentAppID)).data as any;
            
        const simulatedObject = appServiceObj.applicationBuilder.simulators;
        if(simulatedObject){
            simulatedObject.forEach(simulatorConfig => {
                this.createInstance(simulatorConfig);
            });
        } 
     }


    /**
     *
     * Create simulator instances and store it in object.
     * Also start simulator if session is active and simulator start flag is true
     * @param {*} simulatorConfig
     * @returns {DeviceSimulator}
     * @memberof DeviceSimulatorService
     */
    createInstance(simulatorConfig: any): DeviceSimulator {
        const deviceHandle = new DeviceHandle(this.inventoryService, this.measurementService, 
            simulatorConfig, this.appService, this.currentAppID, this.currentUserDetails, this.simulatorLockService);

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
        if (simulatorConfig.config.isSimulatorStarted && (this.isActiveSession)){
            instance.start();
        }
        return instance;
    }


    /**
     *
     * Delete current simulator instance
     * @param {DeviceSimulatorInstance} simulator
     * @memberof DeviceSimulatorService
     */
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


    /**
     * Check the lock status at every 5 seconds.
     *  If lock timestand difference is >10 sec than lock will be released So other browser session can start simulation automatically
     *
     * @memberof DeviceSimulatorService
     */
    async updateLockTracker() {
        if (this.simulatorLockTrackerLiveData) {
            let simulatorsLock = this.simulatorLockTrackerLiveData.simulatorsLock;
            const lockTrackerDate = (new Date() as any) - (new Date(this.simulatorLockTrackerLiveData.simulatorLockTracker) as any);
          //  console.log("sec=" + lockTrackerDate / 1e3);
            if (simulatorsLock.isLocked) {
                if (Math.floor(lockTrackerDate / 1e3) > 10) {
                    this.simulatorLockService.updateActiveSession(false);
                    simulatorsLock = {
                        isLocked: false,
                        lockedBy: '',
                        lockedOn: '',
                        lockedDisplayName: ''
                    }
                    this.simulatorLockTrackerLiveData.simulatorsLock = simulatorsLock;
                    this.updateRealtimeInstance();
                    this.inventoryService.update({
                        ...this.simulatorLockTrackerLiveData
                    });

                } else if (this.simulatorLockService.isActiveSession()) {
                    this.simulatorLockTrackerLiveData.simulatorLockTracker = new Date().toISOString();
                    this.inventoryService.update({
                        ...this.simulatorLockTrackerLiveData
                    });
                } else {
                    this.updateRealtimeInstance();
                }

            } else {
                this.updateRealtimeInstance();
            }
        }
    }

    
    /**
     * Update realtime instance in case of lock is released on aquired by browser session
     * Also update realtime status of simulators
     * @private
     * @memberof DeviceSimulatorService
     */
    private async updateRealtimeInstance(){
        let appServiceData = this.appServiceLiveData
        const simulators = appServiceData.applicationBuilder.simulators;
        this.simulatorInstances.forEach((SMinstance: any) => {
            simulators.forEach(simulator => {
                if (simulator.id === SMinstance.id) {
                    SMinstance.instance.config = simulator.config;
                    if (!this.checkLocked() && SMinstance.instance.config.isSimulatorStarted){
                      //  console.log('starting simulator...');
                        SMinstance.instance.start();
                    }
                }
            });
        });
    }
}