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
import { SimulationStrategyConfigComponent } from "../../builder/simulator/simulation-strategy";
import * as _ from 'lodash';
import { DtdlSimulationModel } from '../../builder/simulator/simulator-config';


@Component({
    template: `
        <div class="form-group">
            <label for="value"><span>Latitude value</span></label>
            <input type="text" class="form-control" id="latitude" name="latitude" placeholder="e.g. 40.66, 50.40 (required)" required [(ngModel)]="config.latitude">
        </div> 
        <div class="form-group">
        <label for="value"><span>Altitude value</span></label>
        <input type="text" class="form-control" id="altitude" name="altitude" placeholder="e.g. 0, 1 (required)" required [(ngModel)]="config.altitude">
    </div> 
        <div class="form-group">
            <label for="value"><span>Longitude Value</span></label>
            <input type="text" class="form-control" id="longitude" name="longitude" placeholder="e.g. -74.20, -75.20 (required)" required [(ngModel)]="config.longitude">
        </div> 
         <div class="form-group">
            <label for="interval"><span>Interval (seconds)</span></label>
            <input type="number" class="form-control" id="interval" name="interval" placeholder="e.g. 10 (required)" required [(ngModel)]="config.interval">
        </div>  
    `
})
export class PositionUpdateSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {

    config: DtdlSimulationModel;

    initializeConfig(existingConfig?: DtdlSimulationModel) {
        let c: DtdlSimulationModel = {
            deviceId: "",
            matchingValue: "default",
            latitude: "",
            longitude: "",
            altitude: "",
            interval: 5,
            alternateConfigs: undefined
        };

        //TODO: copy alternateconfigs
        if(existingConfig !== undefined || existingConfig !== null) {
            c.interval = existingConfig.interval;
            c.latitude = existingConfig.latitude;
            c.longitude = existingConfig.longitude;
            c.altitude = existingConfig.altitude;
        }

        //New objects can duplicate the default so it can be restored
        //we will create the config entries if old simulators are edited
        //duplication is to avoid changing old code.
        this.config = _.cloneDeep(c);
        this.checkAlternateConfigs();
        this.config.alternateConfigs.operations.push(c);
    }

}