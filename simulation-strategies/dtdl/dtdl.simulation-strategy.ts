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
    simulatorTypeConfigParam: simulatorTypeConfigParam[] = [];
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

    private getValueSeries(modelConfig: any, deviceId: any) {
        let valueSeriesConfigParam:simulatorTypeConfigParam  = this.getSimulatorConfigParam(deviceId, 'valueSeries', modelConfig.fragment);
        if(valueSeriesConfigParam == null) {
            valueSeriesConfigParam = { deviceId, simulatorType: 'valueSeries', fragment: modelConfig.fragment};
            valueSeriesConfigParam.seriesvalues = modelConfig.value.split(',').map(value => parseFloat(value.trim()));
            valueSeriesConfigParam.seriesValueMeasurementCounter = 0;
        }
        if (valueSeriesConfigParam.seriesValueMeasurementCounter >= valueSeriesConfigParam.seriesvalues.length) {
            valueSeriesConfigParam.seriesValueMeasurementCounter = 0;
        }
        const seriesValue = valueSeriesConfigParam.seriesvalues[valueSeriesConfigParam.seriesValueMeasurementCounter++];
        this.updateSimulatorConfigParam(valueSeriesConfigParam);
        return seriesValue;
    }

    private getRandomWalk(modelConfig: any, deviceId: any) {
        let randomWalkConfigParam:simulatorTypeConfigParam  = this.getSimulatorConfigParam(deviceId, 'randomWalk', modelConfig.fragment);
        if (randomWalkConfigParam == null) {
            randomWalkConfigParam = { deviceId, simulatorType: 'randomWalk', fragment: modelConfig.fragment};
            randomWalkConfigParam.randomWalkMeasurementValue = modelConfig.startingValue;
            randomWalkConfigParam.randomWalkPreviousValue = 0;
        } else {
            const max = Math.max(modelConfig.minValue, modelConfig.maxValue);
            const min = Math.min(modelConfig.minValue, modelConfig.maxValue);
            const maxDelta = Math.abs(modelConfig.maxDelta);
            const delta = maxDelta * 2 * Math.random() - maxDelta;
            randomWalkConfigParam.randomWalkMeasurementValue = Math.min(Math.max(randomWalkConfigParam.randomWalkPreviousValue + delta, min), max);
        }

        randomWalkConfigParam.randomWalkPreviousValue = randomWalkConfigParam.randomWalkMeasurementValue;
        this.updateSimulatorConfigParam(randomWalkConfigParam);
        return Math.round(randomWalkConfigParam.randomWalkMeasurementValue * 100) / 100 ;
    }

    private getSimulatorConfigParam(deviceId: any, simulatorType: string, fragment: string) {
        if(this.simulatorTypeConfigParam && this.simulatorTypeConfigParam.length > 0) {
            const configParams = this.simulatorTypeConfigParam.find((param) => param.deviceId === deviceId && 
            param.simulatorType === simulatorType && param.fragment === fragment);
            return configParams ? configParams : null;
        }
        return null;
    }

    private updateSimulatorConfigParam(configParam: simulatorTypeConfigParam) {
        const matchingIndex = this.simulatorTypeConfigParam.findIndex( config => config.deviceId === configParam.deviceId && 
            config.simulatorType === configParam.simulatorType && config.fragment === configParam.fragment);
        if (matchingIndex > -1) {
            this.simulatorTypeConfigParam[matchingIndex] = configParam;
        } else {
            this.simulatorTypeConfigParam.push(configParam)
        }
    }
    private getMeasurementValue(modelConfig: any, deviceId: any) {
        let mValue: any;
        switch (modelConfig.simulationType) {
            case 'randomValue':
                mValue = this.getRandomValue(modelConfig);            
                break;

            case 'valueSeries':
                mValue = this.getValueSeries(modelConfig, deviceId); 
                break;
            
            case 'randomWalk':
                mValue = this.getRandomWalk(modelConfig, deviceId); 
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
                        value: this.getMeasurementValue(modelConfig, deviceId),
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
                        value: this.getMeasurementValue(modelConfig, deviceId),
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

export interface simulatorTypeConfigParam {
 
    deviceId: string,
    simulatorType: string,
    fragment: string,
    seriesValueMeasurementCounter?: number,
    seriesvalues?: number[],
    randomWalkFirstValue?: boolean
    randomWalkPreviousValue?: number,
    randomWalkMeasurementValue?: number   
}