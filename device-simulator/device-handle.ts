import { InventoryService, MeasurementService, ApplicationService } from '@c8y/client';
import { DeviceSimulatorConfigModule } from 'device-simulator-config/device-simulator-config.module';
import { AppStateService } from '@c8y/ngx-components';
import { SimulationLockService } from './simulation-lock-service';

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

interface valueType {
    type?: string,
    [key: string]: any
}

export class DeviceHandle {
    constructor(private inventoryService: InventoryService, private measurementService: MeasurementService, private simulatorConfig: any,
        private appService: ApplicationService, private appId: any, private currentUserDetails: any,
        private simulatorLockService: SimulationLockService) {}
   
    sendMeasurement(config: any, mValue:any) {
        
        let value: valueType = {};
        value.type = config.type;
        value[config.type] = {
            simulator_measurement: { value: parseFloat(mValue), unit: config.unit }
        }
       
        this.measurementService.create({
            source: { id: this.simulatorConfig.config.deviceId},
            time: new Date().toISOString(),
            ...value
        });
    }
    async updateLockAndStatus(simulatorStatus:boolean){
        let appServiceData = (await this.appService.detail(this.appId)).data as any;
        let simulators = appServiceData.applicationBuilder.simulators
            .filter(x => x.id !== this.simulatorConfig.id);
        this.simulatorConfig.config.isSimulatorStarted = simulatorStatus;
        this.simulatorLockService.updateLock(simulatorStatus, this.currentUserDetails, this.appId, simulators);
        simulators.push({
            id: this.simulatorConfig.id,
            name: this.simulatorConfig.name,
            type: this.simulatorConfig.type,
            config: this.simulatorConfig.config
        });
       
        appServiceData.applicationBuilder.simulators = simulators.length > 0 ? simulators : null
        await this.appService.update({
            id: this.appId,
            applicationBuilder: appServiceData.applicationBuilder
        } as any);
    }

    updateManagedObject(value: any) {
        /* value = {
            gpsLocation: {
                lat: 1,
                lng: 1
            }
        }

        value = {
            name: "hello"
        }
 */
        console.log(`Updating ManagedObject: ${JSON.stringify(value)}`);
        /* this.inventoryService.update({
            id: DeviceSimulatorConfigModule,
            ...value
        }) */
    }
}