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

export interface WaveSimulationStrategyConfig {
    deviceId: string,
    fragment: string,
    series: string,
    waveType: 'sine' | 'sqr' | 'sqr-approx',
    height: number,
    wavelength: number,
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
            <label for="value"><span>Wave Type</span></label>
            <select class="form-control" id="value" name="value" [(ngModel)]="config.waveType">
                <option value="sine">Sinusoid</option>
                <option value="sqr">Square</option>
                <option value="sqr-approx">Square (Approx)</option>
            </select>
        </div>
        <div class="form-group">
            <label for="height"><span>Height</span></label>
            <input type="text" class="form-control" id="height" name="height" placeholder="e.g. 10 (required)" required [(ngModel)]="config.height">
        </div>
        <div class="form-group">
            <label for="wavelength"><span>Wavelength</span></label>
            <input type="text" class="form-control" id="wavelength" name="wavelength" placeholder="e.g. 60 (required)" required [(ngModel)]="config.wavelength">
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
export class WaveSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {
    config: WaveSimulationStrategyConfig;

    initializeConfig(existingConfig?: WaveSimulationStrategyConfig) {
        if(existingConfig === undefined || existingConfig === null) {
            this.config.fragment = "temperature_measurement";
            this.config.series = "T";
            this.config.waveType = 'sine';
            this.config.height = 10;
            this.config.wavelength = 60;
            this.config.unit = "C";
            this.config.interval = 5;
        } else {
            this.config.fragment = existingConfig.fragment;
            this.config.series = existingConfig.series;
            this.config.waveType = existingConfig.waveType;
            this.config.height = existingConfig.height;
            this.config.wavelength = existingConfig.wavelength;
            this.config.unit = existingConfig.unit;
            this.config.interval = existingConfig.interval;
        }
        
    }
}
