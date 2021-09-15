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

import {Component} from "@angular/core";
import { ControlContainer, NgForm } from '@angular/forms';
import { OperationSupport } from "builder/simulator/simulator-config";
import { SimulationStrategyConfigComponent } from "../../builder/simulator/simulation-strategy";
import * as _  from "lodash";


export interface SeriesValueSimulationStrategyConfig  extends OperationSupport<SeriesValueSimulationStrategyConfig>{
    deviceId: string,
    fragment: string,
    series: string,
    value: string
    unit: string,
    interval: number
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
            <label for="value"><span>Value</span></label>
            <input type="text" class="form-control" id="value" name="value" placeholder="e.g. 15,20,30 (required)" required [(ngModel)]="config.value">
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
    viewProviders: [ { provide: ControlContainer, useExisting: NgForm } ]
})
export class SeriesValueSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {

    getNamedConfig(label: string) : SeriesValueSimulationStrategyConfig | undefined {
        let c : SeriesValueSimulationStrategyConfig = this.getConfigAsAny(label);
        return c;
    }

    config: SeriesValueSimulationStrategyConfig;

    initializeConfig() {
        let c : SeriesValueSimulationStrategyConfig = {
            deviceId : "",
            fragment: "temperature_measurement",
            series : "T",
            value : "10, 20, 30",
            unit : "C",
            interval : 5,
            operations : new Map()
        }

        //New objects can duplicate the default so it can be restored
        //we will create the config entries if old simulators are edited
        //duplication is to avoid changing old code.
        this.config = _.cloneDeep(c);
        this.config.operations['default'] = c;
    }
}
