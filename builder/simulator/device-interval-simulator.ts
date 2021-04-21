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

import { Injector } from '@angular/core';
import { InventoryService } from '@c8y/client';
import {DeviceSimulator} from "./device-simulator";

/**
 * An abstract simulator that generates values at a fixed interval
 */
export abstract class DeviceIntervalSimulator extends DeviceSimulator {
    protected abstract get interval();
    protected abstract get strategyConfig();

    private intervalHandle;

    abstract onTick(deviceId?:string);
    private inventoryService: InventoryService;
    constructor(protected injector: Injector) { 
        super(); 
        this.inventoryService = injector.get(InventoryService);
    }
    onStart() {
        this.intervalHandle = setInterval(() => {
            // For group simulators 
            if(this.strategyConfig && this.strategyConfig.isGroup) {
                this.getDeviceList(this.strategyConfig.deviceId).then((deviceList: any)=> {
                    if(deviceList && deviceList.length > 0) {
                        deviceList.forEach(device => {
                            this.onTick(device.id);
                        });
                    }
                });
            } else  {
                this.onTick()
            }
            
        }, this.interval);
        this.started = true;
    }

    onStop() {
        clearInterval(this.intervalHandle);
        this.started = false;
    }

    private async getDeviceList(DeviceGroup) {

        let response: any = null;
        const filter: object = {
          pageSize: 10000,
          withTotalPages: true
        };
        response = (await this.inventoryService.childAssetsList(DeviceGroup, filter)).data;
    
        return response;
      }
}
