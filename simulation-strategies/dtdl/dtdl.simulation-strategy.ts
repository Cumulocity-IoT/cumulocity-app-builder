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


import {SimulationStrategy} from "../../builder/simulator/simulation-strategy.decorator";
import {DeviceIntervalSimulator} from "../../builder/simulator/device-interval-simulator";
import {Injectable} from "@angular/core";
import {SimulationStrategyFactory} from "../../builder/simulator/simulation-strategy";
import {MeasurementService} from "@c8y/client";
import {SimulatorConfig} from "../../builder/simulator/simulator-config";
import { DtdlSimulationStrategyConfig, DtdlSimulationStrategyConfigComponent } from './dtdl.config.component';

@SimulationStrategy({
    name: "DTDL (Digital Twin Definition Language)",
    icon: "windows",
    description: "Simulate a device based on DTDL",
    modalSize: "modal-md",
    configComponent: DtdlSimulationStrategyConfigComponent
})
export class DtdlSimulationStrategy extends DeviceIntervalSimulator {
    constructor(private measurementService: MeasurementService, private config: DtdlSimulationStrategyConfig) {
        super();
    }

    get interval() {
        return this.config.interval * 1000;
    }

    onTick() {
        /* const measurementValue = Math.floor(Math.random() * (this.config.maxValue - this.config.minValue + 1)) + this.config.minValue;

        this.measurementService.create({
            sourceId: this.config.deviceId,
            time: new Date(),
            [this.config.fragment]: {
                [this.config.series]: {
                    value: measurementValue,
                    ...this.config.unit && {unit: this.config.unit}
                }
            }
        }); */
    }
}

@Injectable()
export class DtdlSimulationStrategyFactory extends SimulationStrategyFactory<DtdlSimulationStrategy> {
    constructor(private measurementService: MeasurementService) {
        super();
    }

    createInstance(config: SimulatorConfig<DtdlSimulationStrategyConfig>): DtdlSimulationStrategy {
        return new DtdlSimulationStrategy(this.measurementService, config.config);
    }

    getSimulatorClass(): typeof DtdlSimulationStrategy {
        return DtdlSimulationStrategy;
    }
}
