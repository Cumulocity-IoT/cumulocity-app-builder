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
import {SimulationStrategy} from "../../builder/simulator/simulation-strategy.decorator";
import {DeviceIntervalSimulator} from "../../builder/simulator/device-interval-simulator";
import {Injectable} from "@angular/core";
import {SimulationStrategyFactory} from "../../builder/simulator/simulation-strategy";
import {MeasurementService} from "@c8y/client";
import {SimulatorConfig} from "../../builder/simulator/simulator-config";

@SimulationStrategy({
    name: "Random Walk",
    icon: "line-chart",
    description: "Simulates a value based on a random offset from the previous value",
    configComponent: RandomWalkSimulationStrategyConfigComponent
})
export class RandomWalkSimulationStrategy extends DeviceIntervalSimulator {
    firstValue: boolean = true;
    previousValue: number = 0;
    constructor(private measurementService: MeasurementService, private config: RandomWalkSimulationStrategyConfig) {
        super();
    }

    get interval() {
        return this.config.interval * 1000;
    }

    onStart() {
        super.onStart();
        this.firstValue = true;
        this.previousValue = 0;
    }

    onTick() {
        let measurementValue;
        if (this.firstValue) {
            measurementValue = this.config.startingValue;
            this.firstValue = false;
        } else {
            const max = Math.max(this.config.minValue, this.config.maxValue);
            const min = Math.min(this.config.minValue, this.config.maxValue);
            const maxDelta = Math.abs(this.config.maxDelta);
            const delta = maxDelta * 2 * Math.random() - maxDelta;
            measurementValue = Math.min(Math.max(this.previousValue + delta, min), max);
        }

        this.previousValue = measurementValue;

        this.measurementService.create({
            sourceId: this.config.deviceId,
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
export class RandomWalkSimulationStrategyFactory extends SimulationStrategyFactory<RandomWalkSimulationStrategy> {
    constructor(private measurementService: MeasurementService) {
        super();
    }

    createInstance(config: SimulatorConfig<RandomWalkSimulationStrategyConfig>): RandomWalkSimulationStrategy {
        return new RandomWalkSimulationStrategy(this.measurementService, config.config);
    }

    getSimulatorClass(): typeof RandomWalkSimulationStrategy {
        return RandomWalkSimulationStrategy;
    }
}
