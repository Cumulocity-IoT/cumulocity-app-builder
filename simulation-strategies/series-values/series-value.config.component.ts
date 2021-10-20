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
import * as _ from "lodash";


export interface SeriesValueSimulationStrategyConfig extends OperationSupport<SeriesValueSimulationStrategyConfig> {
    deviceId: string,
    fragment: string,
    series: string,
    value: string,
    unit: string,
    interval: number,
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
            <!-- <div> {{config.operations | json}} </div> -->
            <label for="value"><span>Default Value</span></label>
            <input type="text" class="form-control" id="value" name="value" placeholder="e.g. 15,20,30 (required)" required [(ngModel)]="config.operations[0].config.value">
            <div class="form-group" *ngIf="config.operations.length > 1">
                <label for="opSource"><span>Operation Source</span></label>
                <input type="text" class="form-control" id="opSource" name="opSource" placeholder="e.g. device Id" required autofocus [(ngModel)]="config.operations[1].deviceId">
                <label for="opPayload"><span>payload key</span></label>
                <input type="text" class="form-control" id="opPayload" name="opPayload" placeholder="e.g. c8y_command.text" required autofocus [(ngModel)]="config.operations[1].payloadFragment">
                <label for="opReply"><span>mark operation handled</span></label>
                <input class="form-check-input" type="checkbox" id="opReply" name="opReply" [(ngModel)]="config.operations[1].opReply">
            </div>
            <div class="form-group" *ngIf="config.operations.length > 1">
                <div *ngFor="let op of config.operations; let i = index">
                    <div class="form-group" *ngIf="i > 0">
                        <label for="opMatch_{{i}}"><span>Matching</span></label>
                        <input type="text" class="form-control" id="opMatch_{{i}}" name="opMatch_{{i}}" placeholder="e.g. WINDY" required [(ngModel)]="config.operations[i].matchingValue">
                        <label for="opValue_{{i}}"><span>Values</span></label>
                        <input type="text" class="form-control" id="opValue_{{i}}" name="opValue_{{i}}" placeholder="e.g. 15,20,30 (required)" required [(ngModel)]="config.operations[i].config.value">
                    </div>
                </div>
            </div>
            <div>
                <button class="btn btn-link btn-block" type="button" (click)="newOperation()" >
                    <div class="pull-left float-left">add operation</div>
                </button>
            </div>
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
export class SeriesValueSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {

    getNamedConfig(label: string): SeriesValueSimulationStrategyConfig | undefined {
        let c: SeriesValueSimulationStrategyConfig = this.getConfigAsAny(label);
        return c;
    }

    config: SeriesValueSimulationStrategyConfig;

    newOperation() {

        let c: SeriesValueSimulationStrategyConfig = {
            deviceId: "",
            fragment: "temperature_measurement",
            series: "T",
            value: "10, 20, 30",
            unit: "C",
            interval: 5,
            operations: undefined
        };

        let opDef: OperationDefinitions<any> = {
            config: c,
            deviceId: "",
            payloadFragment: "default",
            matchingValue: "default",
            opReply: false
        };

        this.config.operations.push(opDef);
        console.log(this.config.operations);
    }

    initializeConfig() {
        let c: SeriesValueSimulationStrategyConfig = {
            deviceId: "",
            fragment: "temperature_measurement",
            series: "T",
            value: "10, 20, 30",
            unit: "C",
            interval: 5,
            operations: new Array()
        };

        let opDef: OperationDefinitions<any> = {
            config: c,
            deviceId: "",
            payloadFragment: "default",
            matchingValue: "default",
            opReply: false
        };

        //New objects can duplicate the default so it can be restored
        //we will create the config entries if old simulators are edited
        //duplication is to avoid changing old code.
        this.config = _.cloneDeep(c);
        this.config.operations.push(opDef);
    }

}
