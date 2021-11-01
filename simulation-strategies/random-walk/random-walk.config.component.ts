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
import { DtdlSimulationModel } from "builder/simulator/simulator-config";
import { SimulationStrategyConfigComponent } from "../../builder/simulator/simulation-strategy";
import * as _ from 'lodash';


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
            <label class="c8y-checkbox">
            <input name="opEnabled" type="checkbox" [(ngModel)]="config.alternateConfigs.opEnabled"/>
                <span></span>
                <span>Controlled by operation</span>
            </label>
        </div>

        <ng-container *ngIf="config.alternateConfigs.opEnabled">
            <div class="form-group">
                <accordion  [isAnimated]="true" [closeOthers]="true">
                    <accordion-group panelClass="op-simulator-panel" #opGroup>
                        <button class="btn btn-link btn-block clearfix" accordion-heading type="button">
                            <div class="pull-left float-left">Operation details</div>
                            <span class="float-right pull-right"><i *ngIf="opGroup.isOpen" class="fa fa-caret-up"></i>
                            <i *ngIf="!opGroup.isOpen" class="fa fa-caret-down"></i></span>
                        </button>
                        <div class="row">
                            <div class="col-lg-6 op-field">
                                <label for="opSource"><span>Operation Source</span></label>
                                <device-selector id="opSource" name="opSource" [(value)]="config.alternateConfigs.opSourceName" [placeHolder]="'Type your Device Name'" [required]="true" (selectedDevice)= "getSelectedDevice($event)"></device-selector>
                            </div>
                            <div class="col-lg-6 op-field">
                                <label for="opPayload"><span>Payload Key</span></label>
                                <input type="text" class="form-control" id="opPayload" name="opPayload" placeholder="e.g. c8y_command.text" required autofocus [(ngModel)]="config.alternateConfigs.payloadFragment">
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-lg-12 op-field">
                                <label class="c8y-checkbox">
                                    <input type="checkbox" id="opReply" name="opReply" [(ngModel)]="config.alternateConfigs.opReply" />
                                    <span></span>
                                    <span>Mark operation handled</span>
                                </label>
                            </div>
                        </div>
                        <hr /> 
                        <div class="row" *ngFor="let op of config.alternateConfigs.operations; let i = index">
                            <ng-container *ngIf="i > 0">
                                <div class="col-lg-12">
                                    <div class="row">
                                        <div class="col-lg-6 op-field">
                                            <label for="opMatch_{{i}}"><span>Matching</span></label>
                                            <input type="text" class="form-control" id="opMatch_{{i}}" name="opMatch_{{i}}" placeholder="e.g. WINDY" required [(ngModel)]="config.alternateConfigs.operations[i].matchingValue">
                                        </div>
                                        <div class="col-lg-6 op-field">
                                            <label for="startingvalue_{{i}}"><span>Starting Value</span></label>
                                            <input type="number" class="form-control" id="startingvalue_{{i}}" name="startingvalue_{{i}}" placeholder="e.g. 10 (required)" required [(ngModel)]="config.alternateConfigs.operations[i].startingValue">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-lg-6 op-field">
                                            <label for="maxdelta_{{i}}"><span>Maximum Change Amount</span></label>
                                            <input type="number" class="form-control" id="maxdelta_{{i}}" name="maxdelta_{{i}}" min="0" placeholder="e.g. 10 (required)" required [(ngModel)]="config.alternateConfigs.operations[i].maxDelta">
                                        </div>
                                        <div class="col-lg-6 op-field">
                                            <label for="minvalue_{{i}}"><span>Minimum Value</span></label>
                                            <input type="number" class="form-control" id="minvalue_{{i}}" name="minvalue_{{i}}" placeholder="e.g. 10 (required)" required [(ngModel)]="config.alternateConfigs.operations[i].minValue">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-lg-6 op-field">
                                            <label for="maxvalue_{{i}}"><span>Maximum Value</span></label>
                                            <input type="number" class="form-control" id="maxvalue_{{i}}" name="maxvalue_{{i}}" placeholder="e.g. 20 (required)" required [(ngModel)]="config.alternateConfigs.operations[i].maxValue">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-lg-6 op-field">
                                        <button class="btn btn-link btn-block" type="button" (click)="deleteOperation(i)">
                                                <div class="pull-left float-left">Remove condition</div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <hr />          
                            </ng-container>
                        </div>
                        <button class="btn btn-link btn-block" type="button" (click)="newOperation('rand_value',config.alternateConfigs.operations.length)">
                            <div class="pull-left float-left">Add condition</div>
                        </button>
                    </accordion-group>
                </accordion>
            </div>
        </ng-container>
        

        <div class="form-group">
            <label for="unit"><span>Unit</span></label>
            <input type="text" class="form-control" id="unit" name="unit" placeholder="e.g. C (optional)" [(ngModel)]="config.unit">
        </div> 
         <div class="form-group">
            <label for="interval"><span>Interval (seconds)</span></label>
            <input type="number" class="form-control" id="interval" name="interval" placeholder="e.g. 5 (required)" required [(ngModel)]="config.interval">
        </div>
    `,
    styles: [`
    :host >>> .panel.op-simulator-panel .panel-title {
         width: 100%;
    }
    .op-field {
        margin-bottom: 10px;
    }
    `],
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class RandomWalkSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {

    config: DtdlSimulationModel;

    getSelectedDevice(device: any) {
        this.config.alternateConfigs.opSource = device.id;
        this.config.alternateConfigs.opSourceName = device.name;
    }

    newOperation(base: string, index: number ) {

        this.checkAlternateConfigs();

        let c: DtdlSimulationModel = {
            deviceId: this.config.deviceId,
            matchingValue: `${base}_match_${index}`,
            fragment: "temperature_measurement",
            series: `${base}_series_${index}`,
            value: "10, 20, 30",
            unit: "C",
            alternateConfigs: undefined
        };

        
        this.config.alternateConfigs.operations.push(c);
        console.log(this.config.alternateConfigs.operations);
    }

    initializeConfig() {

        let c: DtdlSimulationModel = {
            deviceId: "",
            fragment: "temperature_measurement",
            series: "T",
            startingValue: 15,
            maxDelta: 3,
            minValue: 10,
            maxValue: 20,
            unit: "C",
            interval: 5,
            alternateConfigs: undefined,
            matchingValue: "default"
        };

        //New objects can duplicate the default so it can be restored
        //we will create the config entries if old simulators are edited
        //duplication is to avoid changing old code.
        this.config = _.cloneDeep(c);
        this.checkAlternateConfigs();
        this.config.alternateConfigs.operations.push(c);
    }

}
