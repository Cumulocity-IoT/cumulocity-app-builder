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

export interface WaveSimulationStrategyConfig extends OperationSupport<WaveSimulationStrategyConfig> {
    deviceId: string,
    fragment: string,
    series: string,
    waveType: 'sine' | 'sqr' | 'sqr-approx',
    height: number,
    wavelength: number,
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
                <label for="value"><span>Wave Type</span></label>
                <select class="form-control" id="value" name="value" [(ngModel)]="config.operations[0].config.waveType">
                    <option value="sine">Sinusoid</option>
                    <option value="sqr">Square</option>
                    <option value="sqr-approx">Square (Approx)</option>
                </select>
            </div>
            <div class="form-group">
                <label for="height"><span>Height</span></label>
                <input type="text" class="form-control" id="height" name="height" placeholder="e.g. 10 (required)" required [(ngModel)]="config.operations[0].config.height">
            </div>
            <div class="form-group">
                <label for="wavelength"><span>Wavelength</span></label>
                <input type="text" class="form-control" id="wavelength" name="wavelength" placeholder="e.g. 60 (required)" required [(ngModel)]="config.operations[0].config.wavelength">
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
                    </div>
                    <div class="form-group" *ngIf="i > 0">
                        <label for="value_{{i}}"><span>Wave Type</span></label>
                        <select class="form-control" id="value_{{i}}" name="value_{{i}}" [(ngModel)]="config.operations[i].config.waveType">
                            <option value="sine">Sinusoid</option>
                            <option value="sqr">Square</option>
                            <option value="sqr-approx">Square (Approx)</option>
                        </select>
                    </div>
                    <div class="form-group" *ngIf="i > 0">
                        <label for="height_{{i}}"><span>Height</span></label>
                        <input type="text" class="form-control" id="height_{{i}}" name="height_{{i}}" placeholder="e.g. 10 (required)" required [(ngModel)]="config.operations[i].config.height">
                    </div>
                    <div class="form-group" *ngIf="i > 0">
                        <label for="wavelength_{{i}}"><span>Wavelength</span></label>
                        <input type="text" class="form-control" id="wavelength_{{i}}" name="wavelength_{{i}}" placeholder="e.g. 60 (required)" required [(ngModel)]="config.operations[i].config.wavelength">
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
export class WaveSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {

    getNamedConfig(label: string): WaveSimulationStrategyConfig {
        let c: WaveSimulationStrategyConfig = this.getConfigAsAny(label);
        return c;
    }

    config: WaveSimulationStrategyConfig;

    newOperation() {
        let c: WaveSimulationStrategyConfig = {
            deviceId: "",
            fragment: "temperature_measurement",
            series: "T",
            waveType: 'sine',
            height: 10,
            wavelength: 60,
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
        let c: WaveSimulationStrategyConfig = {
            deviceId: "",
            fragment: "temperature_measurement",
            series: "T",
            waveType: 'sine',
            height: 10,
            wavelength: 60,
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
