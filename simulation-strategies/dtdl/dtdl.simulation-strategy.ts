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
    name: "DTDL",
    icon: "windows",
    description: "Simulate a device based on DTDL (Digital Twin Definition Language)",
    hideSimulatorName: true, // hide default simulator name field
    configComponent: DtdlSimulationStrategyConfigComponent
})
export class DtdlSimulationStrategy extends DeviceIntervalSimulator {
    seriesValueMeasurementCounter = 0;
    seriesvalues: number[] = [];
    randomWalkFirstValue: boolean = true;
    randomWalkPreviousValue: number = 0;
    randomWalkMeasurementValue: number = null;
    constructor(private measurementService: MeasurementService, private config: DtdlSimulationStrategyConfig) {
        super();
    }

    get interval() {
        return this.config.interval * 1000;
    }

    onTick() {
        
        const dtdlConfigModel = this.config.dtdlModelConfig;
        dtdlConfigModel.forEach( modelConfig => {
            switch (modelConfig.simulationType) {
                case 'randomValue':
                    const measurementValue = Math.floor(Math.random() * (modelConfig.maxValue - modelConfig.minValue + 1)) + modelConfig.minValue;
                    this.createMeasurements(this.config.deviceId, modelConfig, measurementValue);                
                    break;

                case 'valueSeries':
                    if(this.seriesvalues.length === 0) {
                        this.seriesvalues = modelConfig.value.split(',').map(value => parseFloat(value.trim()));
                    }
                    if (this.seriesValueMeasurementCounter >= this.seriesvalues.length) {
                        this.seriesValueMeasurementCounter = 0;
                    }
                    this.createMeasurements(this.config.deviceId, modelConfig, this.seriesvalues[this.seriesValueMeasurementCounter++]);                
                    break;

                case 'randomWalk':
                    if (this.randomWalkMeasurementValue === null) {
                        this.randomWalkMeasurementValue = modelConfig.startingValue;
                        this.randomWalkPreviousValue = 0;
                    } else {
                        const max = Math.max(modelConfig.minValue, modelConfig.maxValue);
                        const min = Math.min(modelConfig.minValue, modelConfig.maxValue);
                        const maxDelta = Math.abs(modelConfig.maxDelta);
                        const delta = maxDelta * 2 * Math.random() - maxDelta;
                        this.randomWalkMeasurementValue = Math.min(Math.max(this.randomWalkPreviousValue + delta, min), max);
                    }

                    this.randomWalkPreviousValue = this.randomWalkMeasurementValue;
                    this.createMeasurements(this.config.deviceId, modelConfig, this.randomWalkMeasurementValue);
                    break;

                default:
                    break;
            }
            
        });
    }
    private createMeasurements(deviceId: any, modelConfig:any, value: any) {
        this.measurementService.create({
            sourceId: deviceId,
            time: new Date(),
            [modelConfig.fragment]: {
                [modelConfig.series]: {
                    value: value,
                    ...modelConfig.unit && {unit: modelConfig.unit}
                }
            }
        });
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
