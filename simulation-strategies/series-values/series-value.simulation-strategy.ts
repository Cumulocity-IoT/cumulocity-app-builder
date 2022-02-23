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
    SeriesValueSimulationStrategyConfigComponent
} from "./series-value.config.component";
import { SimulationStrategy } from "../../builder/simulator/simulation-strategy.decorator";
import { DeviceIntervalSimulator } from "../../builder/simulator/device-interval-simulator";
import { Injectable, Injector } from "@angular/core";
import { SimulationStrategyFactory } from "../../builder/simulator/simulation-strategy";
import { IOperation, MeasurementService, OperationStatus } from "@c8y/client";
import { DtdlSimulationModel, SimulatorConfig } from "../../builder/simulator/simulator-config";
import * as _ from 'lodash';
import { OperationService } from "@c8y/ngx-components/api";

@SimulationStrategy({
    name: "Value Series",
    icon: "bar-chart",
    description: "Simulates a line based on Series of values",
    configComponent: SeriesValueSimulationStrategyConfigComponent
})
export class SeriesValueSimulationStrategy extends DeviceIntervalSimulator {
    /*     values: number[] = [];
        measurementCounter = 0; */
    valueSeriesConfigParam: valueSeriesConfigParam[] = [];
    constructor(protected injector: Injector, private measurementService: MeasurementService, private opservice: OperationService , private config: DtdlSimulationModel) {
        super(injector);
    }

    protected get interval() {
        return this.config.interval * 1000;
    }

    get strategyConfig() {
        return this.config;
    }
    onStart() {
        super.onStart();
        if (this.config.alternateConfigs && this.config.alternateConfigs.operations && this.config.alternateConfigs.operations.length > 0) {
            this.config.value= this.config.alternateConfigs.operations[0].value;
        }
    }

    public async onOperation(param: any): Promise<boolean> {
        if (this.config.alternateConfigs.operations.length > 1) {
            if (_.has(param, "deviceId") && _.get(param, "deviceId") == this.config.alternateConfigs.opSource) {
                for (let cfg of this.config.alternateConfigs.operations) {
                    if (_.has(param, this.config.alternateConfigs.payloadFragment) && _.get(param, this.config.alternateConfigs.payloadFragment) == cfg.matchingValue) {
                        this.config.value = cfg.value;
                        let vCfg = this.getValueSeriesConfigParam(this.config.deviceId);
                        vCfg.seriesvalues = this.config.value.split(',').map(value => parseFloat(value.trim()));
                        vCfg.seriesValueMeasurementCounter = 0;
                        if (this.config.alternateConfigs.opReply == true) {
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
        const deviceId = (groupDeviceId ? groupDeviceId : this.config.deviceId);
        let valueSeriesConfigParam: valueSeriesConfigParam = this.getValueSeriesConfigParam(deviceId);

        const measurementValue = valueSeriesConfigParam.seriesvalues[valueSeriesConfigParam.seriesValueMeasurementCounter++];
        this.updateConfigParam(valueSeriesConfigParam);
        this.measurementService.create({
            sourceId: deviceId,
            time: new Date(),
            [this.config.fragment]: {
                [this.config.series]: {
                    value: measurementValue,
                    ...this.config.unit && { unit: this.config.unit }
                }
            },
            type: this.config.fragment
        });
    }

    private getValueSeriesConfigParam(deviceId: any) {
        let valueSeriesConfigParam: valueSeriesConfigParam = this.getConfigParam(deviceId);
        if (valueSeriesConfigParam === null) {
            valueSeriesConfigParam = { deviceId };
            valueSeriesConfigParam.seriesvalues = this.config.value.split(',').map(value => parseFloat(value.trim()));
            valueSeriesConfigParam.seriesValueMeasurementCounter = 0;
        } else {
            if (valueSeriesConfigParam.seriesValueMeasurementCounter >= valueSeriesConfigParam.seriesvalues.length) {
                valueSeriesConfigParam.seriesValueMeasurementCounter = 0;
            }
        }
        return valueSeriesConfigParam;
    }

    private getConfigParam(deviceId: any) {
        if (this.valueSeriesConfigParam && this.valueSeriesConfigParam.length > 0) {
            const configParams = this.valueSeriesConfigParam.find((param) => param.deviceId === deviceId);
            return configParams ? configParams : null;
        }
        return null;
    }

    private updateConfigParam(configParam: valueSeriesConfigParam) {
        const matchingIndex = this.valueSeriesConfigParam.findIndex(config => config.deviceId === configParam.deviceId);
        if (matchingIndex > -1) {
            this.valueSeriesConfigParam[matchingIndex] = configParam;
        } else {
            this.valueSeriesConfigParam.push(configParam);
        }
    }

}

@Injectable()
export class SeriesValueSimulationStrategyFactory extends SimulationStrategyFactory<SeriesValueSimulationStrategy> {
    constructor(private injector: Injector, private measurementService: MeasurementService, private opservice: OperationService) {
        super();
    }

    createInstance(config: SimulatorConfig): SeriesValueSimulationStrategy {
        return new SeriesValueSimulationStrategy(this.injector, this.measurementService, this.opservice, config.config);
    }

    getSimulatorClass(): typeof SeriesValueSimulationStrategy {
        return SeriesValueSimulationStrategy;
    }
}

export interface valueSeriesConfigParam {

    deviceId: string,
    seriesValueMeasurementCounter?: number,
    seriesvalues?: number[],
}