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

@Component({
    template: `        
      <div class="form-group">
            <label for="type"><span>Type</span></label>
            <input type="text" class="form-control" id="type" name="type" placeholder="e.g. temparature_measurement (required)" required autofocus [(ngModel)]="config.type">
        </div>
        <div class="form-group">
            <label for="minvalue"><span>Minimum Value</span></label>
            <input type="number" class="form-control" id="minvalue" name="minvalue" placeholder="e.g. 15 (required)" required [(ngModel)]="config.minValue">
        </div> 
        <div class="form-group">
            <label for="maxvalue"><span>Maximum Value</span></label>
            <input type="number" class="form-control" id="maxvalue" name="maxvalue" placeholder="e.g. 10 (required)" required [(ngModel)]="config.maxValue">
        </div> 
        <div class="form-group">
            <label for="unit"><span>Unit</span></label>
            <input type="text" class="form-control" id="unit" name="unit" placeholder="e.g. C (required)" required [(ngModel)]="config.unit">
        </div> 
         <div class="form-group">
            <label for="interval"><span>Interval(in ms)</span></label>
            <input type="number" class="form-control" id="interval" name="interval" placeholder="e.g. default 1000 ms (optional)" required [(ngModel)]="config.interval">
        </div>
    `
})
export class RandomValueSimulationStrategyConfigComponent {
    config: any;
}