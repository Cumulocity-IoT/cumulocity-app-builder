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
    RandomValueSimulationStrategyConfig,
    RandomValueSimulationStrategyConfigComponent
} from "./random-value.config.component";
import { SimulationStrategy } from "../../builder/simulator/simulation-strategy.decorator";
import { DeviceIntervalSimulator } from "../../builder/simulator/device-interval-simulator";
import { Injectable, Injector } from "@angular/core";
import { SimulationStrategyFactory } from "../../builder/simulator/simulation-strategy";
import { IOperation, MeasurementService, OperationStatus } from "@c8y/client";
import { SimulatorConfig } from "../../builder/simulator/simulator-config";
import { OperationService } from '@c8y/ngx-components/api';
import * as _ from 'lodash';

@SimulationStrategy({
    name: "Random Value",
    icon: "random",
    description: "Simulates a line based on Random values",
    configComponent: RandomValueSimulationStrategyConfigComponent
})
export class RandomValueSimulationStrategy extends DeviceIntervalSimulator {
    constructor(protected injector: Injector, private measurementService: MeasurementService, private opservice: OperationService,
        private config: RandomValueSimulationStrategyConfig) {
        super(injector);
    }

    get interval() {
        return this.config.interval * 1000;
    }
    get strategyConfig() {
        return this.config;
    }

    public async onOperation(param: any): Promise<boolean> {
        //console.log("Series operation = ", param);
        if (this.config.operations.length > 1) {
            if (_.has(param, "deviceId") && _.get(param, "deviceId") == this.config.operations[1].deviceId) {
                for (let cfg of this.config.operations) {
                    if (_.has(param, this.config.operations[1].payloadFragment) && _.get(param, this.config.operations[1].payloadFragment) == cfg.matchingValue) {
                        console.log(`Matched ${cfg.matchingValue} setting cfg = `, cfg.config);
                        this.config.minValue = cfg.config.minValue;
                        this.config.maxValue = cfg.config.maxValue;
                        if (this.config.operations[1].opReply == true) {
                            const partialUpdateObject: Partial<IOperation> = {
                                id: param.id,
                                status: OperationStatus.SUCCESSFUL
                            };
                            await this.opservice.update(partialUpdateObject);
                        }
                        return true;
                    }
                }
            }
        }
        return false;
    }

    onTick(groupDeviceId?: any) {
        const measurementValue = Math.floor(Math.random() * (this.config.maxValue - this.config.minValue + 1)) + this.config.minValue;

        this.measurementService.create({
            sourceId: (groupDeviceId ? groupDeviceId : this.config.deviceId),
            time: new Date(),
            [this.config.fragment]: {
                [this.config.series]: {
                    value: measurementValue,
                    ...this.config.unit && { unit: this.config.unit }
                }
            }
        });
    }
}

@Injectable()
export class RandomValueSimulationStrategyFactory extends SimulationStrategyFactory<RandomValueSimulationStrategy> {
    constructor(private injector: Injector, private measurementService: MeasurementService, private opservice: OperationService) {
        super();
    }

    createInstance(config: SimulatorConfig<RandomValueSimulationStrategyConfig>): RandomValueSimulationStrategy {
        return new RandomValueSimulationStrategy(this.injector, this.measurementService, this.opservice, config.config);
    }

    getSimulatorClass(): typeof RandomValueSimulationStrategy {
        return RandomValueSimulationStrategy;
    }
}
