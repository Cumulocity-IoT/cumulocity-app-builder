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
import {SimulationStrategy} from "../../builder/simulator/simulation-strategy.decorator";
import {DeviceIntervalSimulator} from "../../builder/simulator/device-interval-simulator";
import {Injectable, Injector} from "@angular/core";
import {SimulationStrategyFactory} from "../../builder/simulator/simulation-strategy";
import {MeasurementService} from "@c8y/client";
import {SimulatorConfig} from "../../builder/simulator/simulator-config";

@SimulationStrategy({
    name: "Random Value",
    icon: "random",
    description: "Simulates a line based on Random values",
    configComponent: RandomValueSimulationStrategyConfigComponent
})
export class RandomValueSimulationStrategy extends DeviceIntervalSimulator {
    constructor(protected injector: Injector, private measurementService: MeasurementService, 
        private config: RandomValueSimulationStrategyConfig) {
        super(injector)
    }

    get interval() {
        return this.config.interval * 1000;
    }
    get strategyConfig() {
        return this.config;
    } 

    onTick(groupDeviceId?: any) {
        const measurementValue = Math.floor(Math.random() * (this.config.maxValue - this.config.minValue + 1)) + this.config.minValue;

        this.measurementService.create({
            sourceId: (groupDeviceId? groupDeviceId : this.config.deviceId),
            time: new Date(),
            [this.config.fragment]: {
                [this.config.series]: {
                    value: measurementValue,
                    ...this.config.unit && {unit: this.config.unit}
                }
            }
        });
    }
}

@Injectable()
export class RandomValueSimulationStrategyFactory extends SimulationStrategyFactory<RandomValueSimulationStrategy> {
    constructor(private injector: Injector, private measurementService: MeasurementService) {
        super();
    }

    createInstance(config: SimulatorConfig<RandomValueSimulationStrategyConfig>): RandomValueSimulationStrategy {
        return new RandomValueSimulationStrategy(this.injector, this.measurementService, config.config);
    }

    getSimulatorClass(): typeof RandomValueSimulationStrategy {
        return RandomValueSimulationStrategy;
    }
}
