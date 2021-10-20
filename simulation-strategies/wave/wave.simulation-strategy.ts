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
    WaveSimulationStrategyConfig,
    WaveSimulationStrategyConfigComponent
} from "./wave.config.component";
import {SimulationStrategy} from "../../builder/simulator/simulation-strategy.decorator";
import {DeviceIntervalSimulator} from "../../builder/simulator/device-interval-simulator";
import {Injectable, Injector} from "@angular/core";
import {SimulationStrategyFactory} from "../../builder/simulator/simulation-strategy";
import { IOperation, MeasurementService, OperationService, OperationStatus } from '@c8y/client';
import {SimulatorConfig} from "../../builder/simulator/simulator-config";
import * as _ from 'lodash';

@SimulationStrategy({
    name: "Waveform",
    icon: "wifi",
    description: "Simulates a line based on a waveform",
    configComponent: WaveSimulationStrategyConfigComponent
})
export class WaveSimulationStrategy extends DeviceIntervalSimulator {

    startTime: number = 0;

    constructor(protected injector: Injector, private measurementService: MeasurementService, private opservice: OperationService, private config: WaveSimulationStrategyConfig) {
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
        this.startTime = Date.now();
    }

    public async onOperation(param: any): Promise<boolean> {
        //console.log("Wavelength operation = ", param);
        if (this.config.operations.length > 1) {
            if (_.has(param, "deviceId") && _.get(param, "deviceId") == this.config.operations[1].deviceId) {
                for (let cfg of this.config.operations) {
                    if (_.has(param, this.config.operations[1].payloadFragment) && _.get(param, this.config.operations[1].payloadFragment) == cfg.matchingValue) {
                        console.log(`Matched ${cfg.matchingValue} setting cfg = `, cfg.config);
                        this.config.waveType = cfg.config.waveType;
                        this.config.height = cfg.config.height;
                        this.config.wavelength = cfg.config.wavelength;
                        if (this.config.operations[1].opReply == true) {
                            const partialUpdateObject: Partial<IOperation> = {
                                id: param.id,
                                status: OperationStatus.SUCCESSFUL
                            }
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
        const t = (Date.now() - this.startTime) / 1000;
        const w = 2 * Math.PI / this.config.wavelength;

        const wt = w * t;

        let measurementValue = 0;
        switch (this.config.waveType) {
            case "sine":
                measurementValue = this.config.height * Math.sin(wt);
                break;
            case "sqr":
                measurementValue = Math.sign(Math.sin(wt)) * this.config.height;
                break;
            case "sqr-approx":
                const max_fourier_terms = 8;
                let fourier_expansion = 0;
                for (let i = 1; i <= max_fourier_terms; i++) {
                    const x = 2 * i - 1;
                    fourier_expansion = fourier_expansion + 1 / x * Math.sin(x * wt);
                }
                measurementValue = this.config.height * 4 / Math.PI * fourier_expansion;
                break;
        }

        this.measurementService.create({
            sourceId: (groupDeviceId? groupDeviceId : this.config.deviceId),
            time: new Date(),
            [this.config.fragment]: {
                [this.config.series]: {
                    value: measurementValue,
                    ...this.config.unit && { unit: this.config.unit }
                }
            }
        });
    }
}

@Injectable()
export class WaveSimulationStrategyFactory extends SimulationStrategyFactory<WaveSimulationStrategy> {
    constructor(private injector: Injector, private measurementService: MeasurementService, private opservice: OperationService) {
        super();
    }

    createInstance(config: SimulatorConfig<WaveSimulationStrategyConfig>): WaveSimulationStrategy {
        return new WaveSimulationStrategy(this.injector, this.measurementService, this.opservice, config.config);
    }

    getSimulatorClass(): typeof WaveSimulationStrategy {
        return WaveSimulationStrategy;
    }
}
