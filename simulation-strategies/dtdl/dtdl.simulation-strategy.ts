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


import { SimulationStrategy } from "../../builder/simulator/simulation-strategy.decorator";
import { DeviceIntervalSimulator } from "../../builder/simulator/device-interval-simulator";
import { Injectable, Injector } from "@angular/core";
import { SimulationStrategyFactory } from "../../builder/simulator/simulation-strategy";
import { MeasurementService, EventService, InventoryService, IManagedObject, OperationStatus, IOperation, OperationService } from "@c8y/client";
import { DtdlSimulationModel, SimulatorConfig } from "../../builder/simulator/simulator-config";
import { DtdlSimulationStrategyConfigComponent } from './dtdl.config.component';
import * as _ from 'lodash';
@SimulationStrategy({
    name: "DTDL",
    icon: "window-restore",
    description: "Simulate a device based on DTDL (Digital Twin Definition Language)",
    hideSimulatorName: true, // hide default simulator name field
    configComponent: DtdlSimulationStrategyConfigComponent
})
export class DtdlSimulationStrategy extends DeviceIntervalSimulator {
    simulatorTypeConfigParam: simulatorTypeConfigParam;
    simulatorTypeConfig: simulatorTypeConfigI[] = [];
    private invService: InventoryService;
    constructor(protected injector: Injector, private measurementService: MeasurementService,
        private config: DtdlSimulationModel, private opservice: OperationService, private eventService: EventService) {
        super(injector);
        this.invService = injector.get(InventoryService);
    }

    get interval() {
        return this.config.interval * 1000;
    }

    get strategyConfig() {
        return this.config;
    }


    public async onOperation(param: any): Promise<boolean> {
        for (let index = 0; index < this.config.dtdlModelConfig.length; index++) {
            const model = this.config.dtdlModelConfig[index];
            //console.log("DTDL operation = ", param, "model", model);
            if (model.alternateConfigs.opEnabled && model.alternateConfigs.operations.length > 1) {
                if (_.has(param, "deviceId") && _.get(param, "deviceId") == model.alternateConfigs.opSource) {
                    model.alternateConfigs.operations.forEach((cfg: DtdlSimulationModel, i: number) => {
                        if (_.has(param, model.alternateConfigs.payloadFragment) && _.get(param, model.alternateConfigs.payloadFragment) == cfg.matchingValue) {
                            //console.log(`Matched ${cfg.matchingValue} setting cfg = `, cfg);
                            model.alternateConfigs.configIndex = i; //used in create measurement below.
                            if (model.alternateConfigs.opReply == true) {
                                const partialUpdateObject: Partial<IOperation> = {
                                    id: param.id,
                                    status: OperationStatus.SUCCESSFUL
                                }
                                this.opservice.update(partialUpdateObject);
                            }
                        }
                    });
                }
            }
        }
        return false;
    }


    // call every time based on interval
    onTick(groupDeviceId?: any) {

        const dtdlConfigModel = this.config.dtdlModelConfig;
        const deviceId = (groupDeviceId ? groupDeviceId : this.config.deviceId);
        if (dtdlConfigModel) {
            // Existing implementation
            const dtdlConfigModelParents = dtdlConfigModel.filter(model => !model.isFieldModel
                || model.simulationType === 'positionUpdate'
                || model.simulationType === 'eventCreation');
            if (dtdlConfigModelParents && dtdlConfigModelParents.length > 0) {
                dtdlConfigModelParents.forEach(modelConfig => {
                    if (modelConfig.simulationType) {
                        if (modelConfig.alternateConfigs) {
                            let cfgIndex = modelConfig.alternateConfigs.configIndex ? modelConfig.alternateConfigs.configIndex : 0;
                            switch (modelConfig.simulationType) {
                                case 'positionUpdate':
                                    this.updatePosition(deviceId, modelConfig.alternateConfigs.operations[cfgIndex]);
                                    break;

                                case 'eventCreation':
                                    this.createEvents(deviceId, modelConfig.alternateConfigs.operations[cfgIndex]);
                                    break;

                                default:
                                    //console.log("index",cfgIndex, "cfg" , modelConfig.alternateConfigs.operations[cfgIndex]);
                                    this.createMeasurements(deviceId, modelConfig.alternateConfigs.operations[cfgIndex]);
                                    break;
                            }
                        } else {
                            switch (modelConfig.simulationType) {
                                case 'positionUpdate':
                                    this.updatePosition(deviceId, modelConfig);
                                    break;

                                case 'eventCreation':
                                    this.createEvents(deviceId, modelConfig);
                                    break;

                                default:
                                    //console.log("index",cfgIndex, "cfg" , modelConfig.alternateConfigs.operations[cfgIndex]);
                                    this.createMeasurements(deviceId, modelConfig);
                                    break;
                            }                            
                        }
                    }
                });
            }

            // idenfity parentId for field series
            const dtdlConfigModelFields = dtdlConfigModel.filter(
                (model, i, arr) => arr.findIndex(t => t.parentId && t.parentId === model.parentId) === i
            );

            // execute measurement for each unique parentId
            if (dtdlConfigModelFields && dtdlConfigModelFields.length > 0) {
                dtdlConfigModelFields.forEach(modelConfig => {
                    this.createMeasurementsSeries(deviceId, modelConfig.parentId, modelConfig.fragment);
                });
            }
        }


    }

    private getRandomValue(modelConfig: any) {
        return Math.floor(Math.random() * (modelConfig.maxValue - modelConfig.minValue + 1)) + modelConfig.minValue;
    }

    private getValueSeries(modelConfig: any, deviceId: any) {
        let valueSeriesConfigParam: simulatorTypeConfigI = this.getSimulatorConfigParam('', 'valueSeries', modelConfig.fragment, modelConfig.series);
        let simulatorTypeConfigParam: simulatorTypeConfigParam = {};
        if (valueSeriesConfigParam == null) {

            simulatorTypeConfigParam = {
                seriesvalues: modelConfig.value.split(',').map(value => parseFloat(value.trim())),
                seriesValueMeasurementCounter: 0
            };
            valueSeriesConfigParam = {
                deviceId: '',
                simulatorType: 'valueSeries',
                fragment: modelConfig.fragment,
                series: modelConfig.series,
                simulatorTypeConfigParam
            };
        }
        simulatorTypeConfigParam = valueSeriesConfigParam.simulatorTypeConfigParam;
        if (simulatorTypeConfigParam.seriesValueMeasurementCounter >= simulatorTypeConfigParam.seriesvalues.length) {
            simulatorTypeConfigParam.seriesValueMeasurementCounter = 0;
        }
        const seriesValue = simulatorTypeConfigParam.seriesvalues[simulatorTypeConfigParam.seriesValueMeasurementCounter++];
        this.updateSimulatorConfigParam(valueSeriesConfigParam, simulatorTypeConfigParam);
        return seriesValue;
    }

    private getRandomWalk(modelConfig: any, deviceId: any) {
        let randomWalkConfigParam: simulatorTypeConfigI = this.getSimulatorConfigParam(deviceId, 'randomWalk', modelConfig.fragment, modelConfig.series);
        let simulatorTypeConfigParam: simulatorTypeConfigParam = {};
        if (randomWalkConfigParam == null) {
            simulatorTypeConfigParam = {
                randomWalkMeasurementValue: modelConfig.startingValue,
                randomWalkPreviousValue: 0
            };
            randomWalkConfigParam = {
                deviceId, simulatorType: 'randomWalk',
                fragment: modelConfig.fragment,
                series: modelConfig.series,
                simulatorTypeConfigParam
            };

        } else {
            simulatorTypeConfigParam = randomWalkConfigParam.simulatorTypeConfigParam;
            const max = Math.max(modelConfig.minValue, modelConfig.maxValue);
            const min = Math.min(modelConfig.minValue, modelConfig.maxValue);
            const maxDelta = Math.abs(modelConfig.maxDelta);
            const delta = maxDelta * 2 * Math.random() - maxDelta;
            simulatorTypeConfigParam.randomWalkMeasurementValue = Math.min(Math.max(simulatorTypeConfigParam.randomWalkPreviousValue + delta, min), max);
        }

        simulatorTypeConfigParam.randomWalkPreviousValue = simulatorTypeConfigParam.randomWalkMeasurementValue;

        this.updateSimulatorConfigParam(randomWalkConfigParam, simulatorTypeConfigParam);
        return Math.round(simulatorTypeConfigParam.randomWalkMeasurementValue * 100) / 100;
    }

    // Find simulator configuration parameters. used to track list of parameters and counter applicable to devices,series,locations, etc.
    private getSimulatorConfigParam(deviceId: any, simulatorType: string, fragment: string, series: string) {
        if (this.simulatorTypeConfig && this.simulatorTypeConfig.length > 0) {
            const configParams = this.simulatorTypeConfig.find((param) => param.deviceId === deviceId &&
                param.simulatorType === simulatorType && param.fragment === fragment && param.series === series);
            return configParams ? configParams : null;
        }
        return null;
    }

    private updateSimulatorConfigParam(configParam: simulatorTypeConfigI, simulatorConfigParam: simulatorTypeConfigParam) {
        const matchingIndex = this.simulatorTypeConfig.findIndex(config => config.deviceId === configParam.deviceId &&
            config.simulatorType === configParam.simulatorType && config.fragment === configParam.fragment
            && config.series === configParam.series);
        if (matchingIndex > -1) {
            configParam.simulatorTypeConfigParam = simulatorConfigParam;
            this.simulatorTypeConfig[matchingIndex] = configParam;
        } else {
            this.simulatorTypeConfig.push(configParam)
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
        //console.log("GetMeasurementValue: ", modelConfig, mValue)
        return mValue;
    }

    // Create measurements series for given dtdl fields details
    private createMeasurementsSeries(deviceId: any, parentId: string, fragment: string) {
        let dtdlConfigModel = this.config.dtdlModelConfig;
       
        const childModelConfigs = dtdlConfigModel.filter(model => model.parentId === parentId && model.simulationType !== 'positionUpdate'
            && model.simulationType !== 'eventCreation') as any;
        if (childModelConfigs && childModelConfigs.length > 0) {
            let fragementmap = new Map();
            childModelConfigs.forEach(field => {
                let modelConfig = field;
                if (field.alternateConfigs) {
                    let cfgIndex = field.alternateConfigs.configIndex ? field.alternateConfigs.configIndex : 0;
                    modelConfig = field.alternateConfigs.operations[cfgIndex];
                 } 
                fragementmap.set(field.series, {
                    value: this.getMeasurementValue(modelConfig, deviceId),
                    ...modelConfig.unit && { unit: modelConfig.unit }
                })
            });
            const modelFragmentObject = Array.from(fragementmap.entries()).reduce((main, [key, value]) => ({ ...main, [key]: value }), {});
            this.measurementService.create({
                sourceId: deviceId,
                time: new Date(),
                [fragment]: {
                    ...modelFragmentObject
                },
                type: fragment
            });
        }
    }
    private createMeasurements(deviceId: any, modelConfig: any) {
        if (modelConfig.schema && modelConfig.schema['@type'] === 'Object' && modelConfig.schema.fields) {
            const fields = modelConfig.schema.fields;
            if (fields && fields.length > 0) {
                let fragementmap = new Map();
                fields.forEach(field => {
                    fragementmap.set(`${modelConfig.series}:${field.name}`, {
                        value: this.getMeasurementValue(modelConfig, deviceId),
                        unit: modelConfig.unit
                    })
                });
                const modelFragmentObject = Array.from(fragementmap.entries()).reduce((main, [key, value]) => ({ ...main, [key]: value }), {});
                this.measurementService.create({
                    sourceId: deviceId,
                    time: new Date(),
                    [modelConfig.fragment]: {
                        ...modelFragmentObject
                    },
                    type: modelConfig.fragment
                });
            }

        } else {
            this.measurementService.create({
                sourceId: deviceId,
                time: new Date(),
                [modelConfig.fragment]: {
                    [modelConfig.series]: {
                        value: this.getMeasurementValue(modelConfig, deviceId),
                        ...modelConfig.unit && { unit: modelConfig.unit }
                    }
                },
                type: modelConfig.fragment
            });
        }

    }

    private createEvents(deviceId: string, modelConfig: any) {
        const time = new Date().toISOString();
        let eventCreationConfigParam: simulatorTypeConfigI = this.getSimulatorConfigParam('', 'eventCreation', modelConfig.measurementName, modelConfig.series);
        let simulatorTypeConfigParam: simulatorTypeConfigParam = {};
        if (eventCreationConfigParam == null) {
            simulatorTypeConfigParam = {
                eventType: modelConfig.eventType.split(','),
                eventText: modelConfig.eventText.split(','),
                eventCounter: 0
            }
            eventCreationConfigParam = {
                deviceId: '',
                simulatorType: 'eventCreation',
                fragment: modelConfig.measurementName,
                series: modelConfig.series,
                simulatorTypeConfigParam
            };
        }

        simulatorTypeConfigParam = eventCreationConfigParam.simulatorTypeConfigParam;
        if (simulatorTypeConfigParam.eventCounter >= simulatorTypeConfigParam.eventType.length || simulatorTypeConfigParam.eventCounter >= simulatorTypeConfigParam.eventType.length) {
            simulatorTypeConfigParam.eventCounter = 0;
        }

        const eventType = simulatorTypeConfigParam.eventType[simulatorTypeConfigParam.eventCounter];
        const eventText = simulatorTypeConfigParam.eventText[simulatorTypeConfigParam.eventCounter++];
        this.updateSimulatorConfigParam(eventCreationConfigParam, simulatorTypeConfigParam);

        this.eventService.create({
            source: {
                id: deviceId
            },
            type: eventType,
            time: time,
            text: eventText
        })
    }
    private updatePosition(deviceId: string, modelConfig: any) {
        const time = new Date().toISOString();
        let positionUpdateConfigParam: simulatorTypeConfigI = this.getSimulatorConfigParam('', 'positionUpdate', modelConfig.measurementName, modelConfig.series);
        let simulatorTypeConfigParam: simulatorTypeConfigParam = {};
        if (positionUpdateConfigParam == null) {
            simulatorTypeConfigParam = {
                positionLatitude: modelConfig.latitude.split(',').map(value => parseFloat(value.trim())),
                positionLongitude: modelConfig.longitude.split(',').map(value => parseFloat(value.trim())),
                positionAltitude: modelConfig.altitude.split(',').map(value => parseFloat(value.trim())),
                positionCounter: 0
            }
            positionUpdateConfigParam = {
                deviceId: '',
                simulatorType: 'positionUpdate',
                fragment: modelConfig.measurementName,
                series: modelConfig.series,
                simulatorTypeConfigParam
            };
        }
        simulatorTypeConfigParam = positionUpdateConfigParam.simulatorTypeConfigParam;
        if (simulatorTypeConfigParam.positionCounter >= simulatorTypeConfigParam.positionLatitude.length || simulatorTypeConfigParam.positionCounter >= simulatorTypeConfigParam.positionLatitude.length) {
            simulatorTypeConfigParam.positionCounter = 0;
        }

        const c8yPsition: C8yPosition = {
            lat: simulatorTypeConfigParam.positionLatitude[simulatorTypeConfigParam.positionCounter],
            lng: simulatorTypeConfigParam.positionLongitude[simulatorTypeConfigParam.positionCounter],
            alt: simulatorTypeConfigParam.positionAltitude[simulatorTypeConfigParam.positionCounter++]
        };
        this.updateSimulatorConfigParam(positionUpdateConfigParam, simulatorTypeConfigParam);

        const deviceToUpdate: Partial<IManagedObject> = {
            id: deviceId,
            c8y_Position: c8yPsition
        };
        this.invService.update(deviceToUpdate);

        this.eventService.create({
            source: {
                id: deviceId
            },
            type: "c8y_LocationUpdate",
            time: time,
            text: modelConfig.measurementName,
            c8y_Position: c8yPsition
        });
    }
}

@Injectable()
export class DtdlSimulationStrategyFactory extends SimulationStrategyFactory<DtdlSimulationStrategy> {
    constructor(private injector: Injector, private measurementService: MeasurementService, private opservice: OperationService, private eventService: EventService) {
        super();
    }

    createInstance(config: SimulatorConfig): DtdlSimulationStrategy {
        return new DtdlSimulationStrategy(this.injector, this.measurementService, config.config, this.opservice, this.eventService);
    }

    getSimulatorClass(): typeof DtdlSimulationStrategy {
        return DtdlSimulationStrategy;
    }
}

export interface simulatorTypeConfigParam {

    seriesValueMeasurementCounter?: number,
    seriesvalues?: number[],
    randomWalkFirstValue?: boolean
    randomWalkPreviousValue?: number,
    randomWalkMeasurementValue?: number
    positionLatitude?: number[],
    positionLongitude?: number[],
    positionAltitude?: number[],
    positionCounter?: number;
    eventType?: string[];
    eventText?: string[];
    eventCounter?: number;
}

export interface simulatorTypeConfigI {
    series: string,
    deviceId: string,
    simulatorType: string,
    fragment: string,
    simulatorTypeConfigParam: simulatorTypeConfigParam
}

export interface C8yPosition {
    lng: any; // in case the coordinates are defined as string...
    alt: any;
    lat: any;
}