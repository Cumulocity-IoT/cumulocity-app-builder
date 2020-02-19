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
    FixedValueSimulationStrategyConfig,
    FixedValueSimulationStrategyConfigComponent
} from "./fixed-value.config.component";
import {SimulationStrategy} from "../../device-simulator/simulation-strategy.decorator";
import {DeviceIntervalSimulator} from "../../device-simulator/device-interval-simulator";
import {Injectable} from "@angular/core";
import {SimulationStrategyFactory} from "../../device-simulator/simulation-strategy";
import {SimulatorConfig} from "../../device-simulator/device-simulator.service";
import { MeasurementService } from "@c8y/client";

@SimulationStrategy({
    name: "Fixed Value",
    icon: "minus",
    description: "Simulates a flat line",
    configComponent: FixedValueSimulationStrategyConfigComponent
})
export class FixedValueSimulationStrategy extends DeviceIntervalSimulator {
    constructor(private measurementService: MeasurementService, private config: FixedValueSimulationStrategyConfig) {
        super();
    }

    protected get interval() {
        return this.config.interval;
    }

    onTick() {
        this.measurementService.create({
            sourceId: this.config.deviceId,
            [this.config.fragment]: {
                [this.config.series]: {
                    value: this.config.value,
                    ...this.config.unit && {unit: this.config.unit}
                }
            }
        });
    }
}

@Injectable()
export class FixedValueSimulationStrategyFactory extends SimulationStrategyFactory<FixedValueSimulationStrategy> {
    constructor(private measurementService: MeasurementService) {
        super();
    }

    createInstance(config: SimulatorConfig<FixedValueSimulationStrategyConfig>): FixedValueSimulationStrategy {
        return new FixedValueSimulationStrategy(this.measurementService, config.config);
    }

    getSimulatorClass(): typeof FixedValueSimulationStrategy {
        return FixedValueSimulationStrategy;
    }
}