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

import {
    FirmwareUpdateSimulationStrategyConfig,
    FirmwareUpdateSimulationStrategyConfigComponent
} from "./firmware-update.config.component";
import {SimulationStrategy} from "../../builder/simulator/simulation-strategy.decorator";
import {Injectable} from "@angular/core";
import {SimulationStrategyFactory} from "../../builder/simulator/simulation-strategy";
import {InventoryService, OperationService, OperationStatus, PagingStrategy} from "@c8y/client";
import {SimulatorConfig} from "../../builder/simulator/simulator-config";
import {DeviceSimulator} from "../../builder/simulator/device-simulator";
import {from, interval, Subscription} from "rxjs";
import {filter, flatMap, switchMap} from "rxjs/operators";

@SimulationStrategy({
    name: "Firmware Update",
    icon: "download",
    description: "A simulator that responds to firmware updates",
    configComponent: FirmwareUpdateSimulationStrategyConfigComponent
})
export class FirmwareUpdateSimulationStrategy extends DeviceSimulator {
    subscriptions = new Subscription();

    constructor(private config: FirmwareUpdateSimulationStrategyConfig, private inventoryService: InventoryService, private operationService: OperationService) {
        super();
    }

    async onStart() {
        const device = (await this.inventoryService.detail(this.config.deviceId)).data;

        // Check that the device supports firmware updates
        if (device.com_cumulocity_model_Agent == undefined) {
            device.com_cumulocity_model_Agent = {};
            await this.inventoryService.update({
                id: this.config.deviceId,
                com_cumulocity_model_Agent: device.com_cumulocity_model_Agent,
            });
        }
        if (device.c8y_SupportedOperations == undefined) {
            device.c8y_SupportedOperations = [];
        }
        if (!device.c8y_SupportedOperations.includes('c8y_Firmware')) {
            device.c8y_SupportedOperations = [...device.c8y_SupportedOperations, 'c8y_Firmware'];
            await this.inventoryService.update({
                id: this.config.deviceId,
                c8y_SupportedOperations: device.c8y_SupportedOperations
            });
        }

        // Check that the initial firmware exists
        for (let firmware of this.config.firmwareVersions) {
            // String injection isn't really a problem here, if the user has edit rights to a simulator then they can do much worse already...
            const availableFirmware = (await this.inventoryService.list({type: 'c8y_Firmware', pageSize: 2000, query: `name eq '${firmware.name}'`})).data;
            if (availableFirmware.length === 0) {
                await this.inventoryService.create({
                    type: 'c8y_Firmware',
                    name: firmware.name,
                    version: firmware.version,
                    url: firmware.url
                });
            }
        }

        // Set the initial firmware version
        switch(this.config.resetOn) {
            case "never":
                break;
            case "restart":
                await this.inventoryService.update({
                    id: this.config.deviceId,
                    c8y_Firmware: {
                        name: this.config.firmwareVersions[0].name,
                        version: this.config.firmwareVersions[0].version,
                        url: this.config.firmwareVersions[0].url
                    }
                });
                break;
        }

        // Start the firmware update listeners
        this.subscriptions.add(interval(5000).pipe(
            switchMap(() => from(this.operationService.list$({
                pageSize: 2000,
                withTotalPages: true,
                deviceId: device.id
            }, {
                pagingStrategy: PagingStrategy.ALL,
                pagingDelay: 0
            }))),
            flatMap(operations => from(operations)),
            filter(operation => operation.c8y_Firmware != undefined),
            filter(operation => [OperationStatus.PENDING, OperationStatus.EXECUTING].includes(operation.status))
        ).subscribe(async (operation) => {
            const nextStatus = this.nextOperationStatus(operation.status);
            await this.operationService.update({
                id: operation.id,
                status: nextStatus
            });

            if (nextStatus == OperationStatus.SUCCESSFUL) {
                await this.inventoryService.update({
                    id: device.id,
                    c8y_Firmware: operation.c8y_Firmware
                });
            }
        }));
    }

    onStop() {
        this.subscriptions.unsubscribe();
    }

    private nextOperationStatus(opStatus: OperationStatus) {
        switch(opStatus) {
            case OperationStatus.PENDING: return OperationStatus.EXECUTING;
            case OperationStatus.EXECUTING: return OperationStatus.SUCCESSFUL;
            default: return opStatus;
        }
    }
}

@Injectable()
export class FirmwareUpdateSimulationStrategyFactory extends SimulationStrategyFactory<FirmwareUpdateSimulationStrategy> {
    constructor(private inventoryService: InventoryService, private operationService: OperationService) {
        super();
    }

    createInstance(config: SimulatorConfig<FirmwareUpdateSimulationStrategyConfig>): FirmwareUpdateSimulationStrategy {
        return new FirmwareUpdateSimulationStrategy(config.config, this.inventoryService, this.operationService);
    }

    getSimulatorClass(): typeof FirmwareUpdateSimulationStrategy {
        return FirmwareUpdateSimulationStrategy;
    }
}
