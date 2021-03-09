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
import {Injectable, Injector} from "@angular/core";
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
    constructor(protected injector: Injector, private measurementService: MeasurementService, private config: DtdlSimulationStrategyConfig) {
        super(injector);
    }

    get interval() {
        return this.config.interval * 1000;
    }

    get strategyConfig() {
        return this.config;
    } 

    onTick(groupDeviceId?: any) {
        
        const dtdlConfigModel = this.config.dtdlModelConfig;
        dtdlConfigModel.forEach( modelConfig => {
            const deviceId =(groupDeviceId? groupDeviceId : this.config.deviceId);
            this.createMeasurements(deviceId, modelConfig); 
        });
    }

    private getRandomValue(modelConfig: any) {
        return Math.floor(Math.random() * (modelConfig.maxValue - modelConfig.minValue + 1)) + modelConfig.minValue;
    }

    private getValueSeries(modelConfig: any) {
        if(this.seriesvalues.length === 0) {
            this.seriesvalues = modelConfig.value.split(',').map(value => parseFloat(value.trim()));
        }
        if (this.seriesValueMeasurementCounter >= this.seriesvalues.length) {
            this.seriesValueMeasurementCounter = 0;
        }
        return this.seriesvalues[this.seriesValueMeasurementCounter++]
    }

    private getRandomWalk(modelConfig: any) {
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
        return this.randomWalkMeasurementValue;
    }
    private getMeasurementValue(modelConfig: any) {
        let mValue: any;
        switch (modelConfig.simulationType) {
            case 'randomValue':
                mValue = this.getRandomValue(modelConfig);            
                break;

            case 'valueSeries':
                mValue = this.getValueSeries(modelConfig); 
                break;
            
            case 'randomWalk':
                mValue = this.getRandomWalk(modelConfig); 
                break;

            default:
                break;
        }
        return mValue;
    }
    private createMeasurements(deviceId: any, modelConfig:any) {
        if(modelConfig.schema && modelConfig.schema['@type'] === 'Object' && modelConfig.schema.fields) {
            const fields = modelConfig.schema.fields;
            if(fields && fields.length > 0 ) {
                let fragementmap = new Map();
                fields.forEach(field => {
                    fragementmap.set(`${modelConfig.series}:${field.name}`, {
                        value: this.getMeasurementValue(modelConfig),
                        unit: modelConfig.unit
                    })
                });
                const modelFragmentObject = Array.from(fragementmap.entries()).reduce((main, [key, value]) => ({...main, [key]: value}), {});
                this.measurementService.create({
                    sourceId: deviceId,
                    time: new Date(),
                    [modelConfig.fragment]: {
                        ...modelFragmentObject
                    }
                });
            }
            
        } else {
            this.measurementService.create({
                sourceId: deviceId,
                time: new Date(),
                [modelConfig.fragment]: {
                    [modelConfig.series]: {
                        value: this.getMeasurementValue(modelConfig),
                        ...modelConfig.unit && {unit: modelConfig.unit}
                    }
                }
            });
        }
        
    }
}

@Injectable()
export class DtdlSimulationStrategyFactory extends SimulationStrategyFactory<DtdlSimulationStrategy> {
    constructor(private injector: Injector, private measurementService: MeasurementService) {
        super();
    }

    createInstance(config: SimulatorConfig<DtdlSimulationStrategyConfig>): DtdlSimulationStrategy {
        return new DtdlSimulationStrategy(this.injector, this.measurementService, config.config);
    }

    getSimulatorClass(): typeof DtdlSimulationStrategy {
        return DtdlSimulationStrategy;
    }
}
