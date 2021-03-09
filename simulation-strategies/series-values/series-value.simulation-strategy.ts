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
    SeriesValueSimulationStrategyConfig,
    SeriesValueSimulationStrategyConfigComponent
} from "./series-value.config.component";
import {SimulationStrategy} from "../../builder/simulator/simulation-strategy.decorator";
import {DeviceIntervalSimulator} from "../../builder/simulator/device-interval-simulator";
import {Injectable, Injector} from "@angular/core";
import {SimulationStrategyFactory} from "../../builder/simulator/simulation-strategy";
import {MeasurementService} from "@c8y/client";
import {SimulatorConfig} from "../../builder/simulator/simulator-config";

@SimulationStrategy({
    name: "Value Series",
    icon: "bar-chart",
    description: "Simulates a line based on Series of values",
    configComponent: SeriesValueSimulationStrategyConfigComponent
})
export class SeriesValueSimulationStrategy extends DeviceIntervalSimulator {
    values: number[] = [];
    measurementCounter = 0;

    constructor(protected injector: Injector, private measurementService: MeasurementService, private config: SeriesValueSimulationStrategyConfig) {
        super(injector);
    }

    protected get interval() {
        return this.config.interval * 1000;
    }
    
    get strategyConfig() {
        return this.config;
    }
    onStart() {
        this.values = this.config.value.split(',').map(value => parseFloat(value.trim()));
        super.onStart();
    }

    onTick(groupDeviceId?: any) {
        if (this.measurementCounter >= this.values.length) {
            this.measurementCounter = 0;
        }

        this.measurementService.create({
            sourceId: (groupDeviceId? groupDeviceId : this.config.deviceId),
            time: new Date(),
            [this.config.fragment]: {
                [this.config.series]: {
                    value: this.values[this.measurementCounter++],
                    ...this.config.unit && {unit: this.config.unit}
                }
            }
        });
    }
}

@Injectable()
export class SeriesValueSimulationStrategyFactory extends SimulationStrategyFactory<SeriesValueSimulationStrategy> {
    constructor(private injector: Injector, private measurementService: MeasurementService) {
        super();
    }

    createInstance(config: SimulatorConfig<SeriesValueSimulationStrategyConfig>): SeriesValueSimulationStrategy {
        return new SeriesValueSimulationStrategy(this.injector, this.measurementService, config.config);
    }

    getSimulatorClass(): typeof SeriesValueSimulationStrategy {
        return SeriesValueSimulationStrategy;
    }
}
