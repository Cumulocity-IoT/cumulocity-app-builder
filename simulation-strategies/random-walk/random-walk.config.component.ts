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

export interface RandomWalkSimulationStrategyConfig extends OperationSupport<RandomWalkSimulationStrategyConfig> {
    deviceId: string,
    fragment: string,
    series: string,
    startingValue: number,
    maxDelta: number,
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
            <!-- <div> {{config.operations | json}} </div> -->
            <label for="value"><span>Default Value</span></label>

            <div class="form-group">
                <label for="startingvalue"><span>Starting Value</span></label>
                <input type="number" class="form-control" id="startingvalue" name="startingvalue" placeholder="e.g. 10 (required)" required [(ngModel)]="config.operations[0].config.startingValue">
            </div>
            <div class="form-group">
                <label for="maxdelta"><span>Maximum Change Amount</span></label>
                <input type="number" class="form-control" id="maxdelta" name="maxdelta" min="0" placeholder="e.g. 10 (required)" required [(ngModel)]="config.operations[0].config.maxDelta">
            </div>
            <div class="form-group">
                <label for="minvalue"><span>Minimum Value</span></label>
                <input type="number" class="form-control" id="minvalue" name="minvalue" placeholder="e.g. 10 (required)" required [(ngModel)]="config.operations[0].config.minValue">
            </div>
            <div class="form-group">
                <label for="maxvalue"><span>Maximum Value</span></label>
                <input type="number" class="form-control" id="maxvalue" name="maxvalue" placeholder="e.g. 20 (required)" required [(ngModel)]="config.operations[0].config.maxValue">
            </div>

            <!-- <input type="text" class="form-control" id="value" name="value" placeholder="e.g. 15,20,30 (required)" required [(ngModel)]="config.operations[0].config.value"> -->
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
                        <div class="form-group">
                            <label for="startingvalue_{{i}}"><span>Starting Value</span></label>
                            <input type="number" class="form-control" id="startingvalue_{{i}}" name="startingvalue_{{i}}" placeholder="e.g. 10 (required)" required [(ngModel)]="config.operations[i].config.startingValue">
                        </div>
                        <div class="form-group">
                            <label for="maxdelta_{{i}}"><span>Maximum Change Amount</span></label>
                            <input type="number" class="form-control" id="maxdelta_{{i}}" name="maxdelta_{{i}}" min="0" placeholder="e.g. 10 (required)" required [(ngModel)]="config.operations[i].config.maxDelta">
                        </div>
                        <div class="form-group">
                            <label for="minvalue_{{i}}"><span>Minimum Value</span></label>
                            <input type="number" class="form-control" id="minvalue_{{i}}" name="minvalue_{{i}}" placeholder="e.g. 10 (required)" required [(ngModel)]="config.operations[i].config.minValue">
                        </div>
                        <div class="form-group">
                            <label for="maxvalue_{{i}}"><span>Maximum Value</span></label>
                            <input type="number" class="form-control" id="maxvalue_{{i}}" name="maxvalue_{{i}}" placeholder="e.g. 20 (required)" required [(ngModel)]="config.operations[1].config.maxValue">
                        </div>
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
export class RandomWalkSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {

    getNamedConfig(label: string): RandomWalkSimulationStrategyConfig {
        let c: RandomWalkSimulationStrategyConfig = this.getConfigAsAny(label);
        return c;
    }

    config: RandomWalkSimulationStrategyConfig;
    newOperation() {

        let c: RandomWalkSimulationStrategyConfig = {
            deviceId: "",
            fragment: "temperature_measurement",
            series: "T",
            startingValue: 15,
            maxDelta: 3,
            minValue: 10,
            maxValue: 20,
            unit: "C",
            interval: 5,
            operations: undefined
        };

        let opDef: OperationDefinitions<any> = {
            config: c,
            deviceId: "",
            payloadFragment: "default",
            matchingValue: "",
            opReply: false
        };

        this.config.operations.push(opDef);
        console.log(this.config.operations);
    }

    initializeConfig() {
        let c: RandomWalkSimulationStrategyConfig = {
            deviceId: "",
            fragment: "temperature_measurement",
            series: "T",
            startingValue: 15,
            maxDelta: 3,
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
