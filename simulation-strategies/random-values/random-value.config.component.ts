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

import { Component } from "@angular/core";
import { ControlContainer, NgForm } from '@angular/forms';
import { OperationDefinitions, OperationSupport } from "builder/simulator/simulator-config";
import { SimulationStrategyConfigComponent } from "../../builder/simulator/simulation-strategy";
import * as _ from 'lodash';

export interface RandomValueSimulationStrategyConfig extends OperationSupport<RandomValueSimulationStrategyConfigComponent> {
    deviceId: string,
    fragment: string,
    series: string,
    minValue: number,
    maxValue: number,
    unit: string,
    interval: number;
}

@Component({
    template: `
        <div class="form-group">
            <label for="fragment"><span>Fragment</span></label>
            <input type="text" class="form-control" id="fragment" name="fragment" placeholder="e.g. temperature_measurement (required)" required autofocus [(ngModel)]="config.fragment">
        </div>
        <div class="form-group">
            <label for="series"><span>Series</span></label>
            <input type="text" class="form-control" id="series" name="series" placeholder="e.g. T (required)" required autofocus [(ngModel)]="config.series">
        </div>
        <div class="form-group">
            <label for="minvalue"><span>Minimum Value</span></label>
            <input type="number" class="form-control" id="minvalue" name="minvalue" placeholder="e.g. 10 (required)" required [(ngModel)]="config.minValue">
        </div> 
        <div class="form-group">
            <label for="maxvalue"><span>Maximum Value</span></label>
            <input type="number" class="form-control" id="maxvalue" name="maxvalue" placeholder="e.g. 20 (required)" required [(ngModel)]="config.maxValue">
        </div> 
        <div class="form-group">
            <label for="unit"><span>Unit</span></label>
            <input type="text" class="form-control" id="unit" name="unit" placeholder="e.g. C (optional)" [(ngModel)]="config.unit">
        </div> 
         <div class="form-group">
            <label for="interval"><span>Interval (seconds)</span></label>
            <input type="number" class="form-control" id="interval" name="interval" placeholder="e.g. 5 (required)" required [(ngModel)]="config.interval">
        </div>
    `,
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class RandomValueSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {

    getNamedConfig(label: string): RandomValueSimulationStrategyConfig {
        let c: RandomValueSimulationStrategyConfig = this.getConfigAsAny(label);
        return c;
    }
    config: RandomValueSimulationStrategyConfig;

    initializeConfig() {
        let c: RandomValueSimulationStrategyConfig = {
            deviceId: "",
            fragment: "temperature_measurement",
            series: "T",
            minValue: 10,
            maxValue: 20,
            unit: "C",
            interval: 5,
            operations: new Array()
        };

        let opDef: OperationDefinitions<any> = {
            config: c,
            deviceId: "",
            payloadFragment: "default",
            matchingValue: ""
        };

        //New objects can duplicate the default so it can be restored
        //we will create the config entries if old simulators are edited
        //duplication is to avoid changing old code.
        this.config = _.cloneDeep(c);
        this.config.operations.push(opDef);
    }

}
