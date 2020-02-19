import { InventoryService, MeasurementService, ApplicationService } from '@c8y/client';
import { SimulationLockService } from './simulation-lock.service';

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
    constructor(private inventoryService: InventoryService, private measurementService: MeasurementService, private simulatorConfig: any) {}
   
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

    /**
     *
     * To be used in future
     * @param {*} value
     */
    updateManagedObject(value: any) {
        console.log(`Updating ManagedObject: ${JSON.stringify(value)}`);
    }
}