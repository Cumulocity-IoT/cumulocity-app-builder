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
    RandomWalkSimulationStrategyConfig,
    RandomWalkSimulationStrategyConfigComponent
} from "./random-walk.config.component";
import { SimulationStrategy } from "../../builder/simulator/simulation-strategy.decorator";
import { DeviceIntervalSimulator } from "../../builder/simulator/device-interval-simulator";
import { Injectable, Injector } from "@angular/core";
import { SimulationStrategyFactory } from "../../builder/simulator/simulation-strategy";
import { IOperation, MeasurementService, OperationService, OperationStatus } from '@c8y/client';
import { SimulatorConfig } from "../../builder/simulator/simulator-config";
import * as _ from 'lodash';

@SimulationStrategy({
    name: "Random Walk",
    icon: "line-chart",
    description: "Simulates a value based on a random offset from the previous value",
    configComponent: RandomWalkSimulationStrategyConfigComponent
})
export class RandomWalkSimulationStrategy extends DeviceIntervalSimulator {

    randomWalkConfigParam: randomWalkConfigParam[] = [];
    constructor(protected injector: Injector, private measurementService: MeasurementService, private opservice: OperationService, private config: RandomWalkSimulationStrategyConfig) {
        super(injector);
    }

    get interval() {
        return this.config.interval * 1000;
    }

    get strategyConfig() {
        return this.config;
    }
    onStart() {
        super.onStart();
    }

    public async onOperation(param: any): Promise<boolean> {
        //console.log("Series operation = ", param);
        if (this.config.operations.length > 1) {
            if (_.has(param, "deviceId") && _.get(param, "deviceId") == this.config.operations[1].deviceId) {
                for (let cfg of this.config.operations) {
                    if (_.has(param, this.config.operations[1].payloadFragment) && _.get(param, this.config.operations[1].payloadFragment) == cfg.matchingValue) {
                        console.log(`Rand Matched ${cfg.matchingValue} setting cfg = `, cfg.config);
                        this.config.minValue = cfg.config.minValue;
                        this.config.maxValue = cfg.config.maxValue;
                        this.config.maxDelta = cfg.config.maxDelta;

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
        let measurementValue;
        const deviceId = (groupDeviceId ? groupDeviceId : this.config.deviceId);

        let randomWalkConfigParam: randomWalkConfigParam = this.getConfigParam(deviceId);
        if (randomWalkConfigParam === null) {
            randomWalkConfigParam = { deviceId };
            randomWalkConfigParam.previousValue = 0;
            measurementValue = this.config.startingValue;
        }
        else {
            const max = Math.max(this.config.minValue, this.config.maxValue);
            const min = Math.min(this.config.minValue, this.config.maxValue);
            const maxDelta = Math.abs(this.config.maxDelta);
            const delta = maxDelta * 2 * Math.random() - maxDelta;
            measurementValue = Math.min(Math.max(randomWalkConfigParam.previousValue + delta, min), max);
        }

        randomWalkConfigParam.previousValue = measurementValue;
        this.updateConfigParam(randomWalkConfigParam);

        this.measurementService.create({
            sourceId: deviceId,
            time: new Date(),
            [this.config.fragment]: {
                [this.config.series]: {
                    value: Math.round(measurementValue * 100) / 100,
                    ...this.config.unit && { unit: this.config.unit }
                }
            }
        });
    }

    private getConfigParam(deviceId: any) {
        if (this.randomWalkConfigParam && this.randomWalkConfigParam.length > 0) {
            const configParams = this.randomWalkConfigParam.find((param) => param.deviceId === deviceId);
            return configParams ? configParams : null;
        }
        return null;
    }

    private updateConfigParam(configParam: randomWalkConfigParam) {
        const matchingIndex = this.randomWalkConfigParam.findIndex(config => config.deviceId === configParam.deviceId);
        if (matchingIndex > -1) {
            this.randomWalkConfigParam[matchingIndex] = configParam;
        } else {
            this.randomWalkConfigParam.push(configParam);
        }
    }
}

@Injectable()
export class RandomWalkSimulationStrategyFactory extends SimulationStrategyFactory<RandomWalkSimulationStrategy> {
    constructor(private injector: Injector, private measurementService: MeasurementService, private opservice: OperationService) {
        super();
    }

    createInstance(config: SimulatorConfig<RandomWalkSimulationStrategyConfig>): RandomWalkSimulationStrategy {
        return new RandomWalkSimulationStrategy(this.injector, this.measurementService, this.opservice, config.config);
    }

    getSimulatorClass(): typeof RandomWalkSimulationStrategy {
        return RandomWalkSimulationStrategy;
    }
}

export interface randomWalkConfigParam {

    deviceId: string,
    previousValue?: number,
    measurementValue?: number;
}