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
import {SimulationStrategyConfigComponent} from "../../builder/simulator/simulation-strategy";

export interface RandomWalkSimulationStrategyConfig {
    deviceId: string,
    fragment: string,
    series: string,
    startingValue: number,
    maxDelta: number,
    minValue: number,
    maxValue: number,
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
            <label for="startingvalue"><span>Starting Value</span></label>
            <input type="number" class="form-control" id="startingvalue" name="startingvalue" placeholder="e.g. 10 (required)" required [(ngModel)]="config.startingValue">
        </div>
        <div class="form-group">
            <label for="maxdelta"><span>Maximum Change Amount</span></label>
            <input type="number" class="form-control" id="maxdelta" name="maxdelta" min="0" placeholder="e.g. 10 (required)" required [(ngModel)]="config.maxDelta">
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
    viewProviders: [ { provide: ControlContainer, useExisting: NgForm } ]
})
export class RandomWalkSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {
    config: RandomWalkSimulationStrategyConfig;

    initializeConfig() {
        this.config.fragment = "temperature_measurement";
        this.config.series = "T";
        this.config.startingValue = 15;
        this.config.maxDelta = 3;
        this.config.minValue = 10;
        this.config.maxValue = 20;
        this.config.unit = "C";
        this.config.interval = 5;
    }
}
