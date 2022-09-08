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
import { DtdlSimulationStrategyModule } from "simulation-strategies/dtdl/dtdl.simulation-strategy.module";
import { SimulatorConfigService } from "../../builder/simulator-config/simulator-config.service";


@Component({
    template: `
        <div class="form-group">
            <label for="fragment"><span>Fragment</span></label>
            <input type="text" class="form-control" id="fragment" name="fragment" placeholder="e.g. temperature_measurement (required)" required autofocus [(ngModel)]="config.fragment" (ngModelChange)="changeFragment(config)">
        </div>
        <div class="form-group">
            <label for="series"><span>Series</span></label>
            <input type="text" class="form-control" id="series" name="series" placeholder="e.g. T (required)" required autofocus [(ngModel)]="config.series" (ngModelChange)="changeSeries(config)">
        </div>
        <div class="form-group">
            <label for="value"><span>Wave Type</span></label>
            <select class="form-control" id="value" name="value" [(ngModel)]="config.alternateConfigs.operations[0].waveType">
                <option value="sine">Sinusoid</option>
                <option value="sqr">Square</option>
                <option value="sqr-approx">Square (Approx)</option>
            </select>
        </div>
        <div class="form-group">
            <label for="height"><span>Height</span></label>
            <input type="text" class="form-control" id="height" name="height" placeholder="e.g. 10 (required)" required [(ngModel)]="config.alternateConfigs.operations[0].height">
        </div>
        <div class="form-group">
            <label for="wavelength"><span>Wavelength</span></label>
            <input type="text" class="form-control" id="wavelength" name="wavelength" placeholder="e.g. 60 (required)" required [(ngModel)]="config.alternateConfigs.operations[0].wavelength">
        </div>
        <ng-container *ngIf="config.alternateConfigs.opEnabled">
            <div class="form-group">
                <label for="match_default"><span>Matching</span></label>
                <input type="text" class="form-control" id="match_default" name="match_default" placeholder="e.g. WINDY" required [(ngModel)]="config.alternateConfigs.operations[0].matchingValue">
            </div>
        </ng-container>

        <div class="form-group" *ngIf="!config.isGroup">
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
                                            <label for="value_{{i}}"><span>Wave Type</span></label>
                                            <select class="form-control" id="value_{{i}}" name="value_{{i}}" [(ngModel)]="config.alternateConfigs.operations[i].waveType">
                                                <option value="sine">Sinusoid</option>
                                                <option value="sqr">Square</option>
                                                <option value="sqr-approx">Square (Approx)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-lg-6 op-field">
                                            <label for="height_{{i}}"><span>Height</span></label>
                                            <input type="text" class="form-control" id="height_{{i}}" name="height_{{i}}" placeholder="e.g. 10 (required)" required [(ngModel)]="config.alternateConfigs.operations[i].height">
                                        </div>
                                        <div class="col-lg-6 op-field">
                                            <label for="wavelength_{{i}}"><span>Wavelength</span></label>
                                            <input type="text" class="form-control" id="wavelength_{{i}}" name="wavelength_{{i}}" placeholder="e.g. 60 (required)" required [(ngModel)]="config.alternateConfigs.operations[i].wavelength">
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
                        <button class="btn btn-link btn-block" type="button" (click)="newOperation('wave_value',config.alternateConfigs.operations.length)">
                            <div class="pull-left float-left">Add condition</div>
                        </button>
                    </accordion-group>
                </accordion>
            </div>
        </ng-container>

        <div class="form-group">
            <label for="unit"><span>Unit</span></label>
            <input type="text" class="form-control" id="unit" name="unit" placeholder="e.g. C (optional)" [(ngModel)]="config.unit" (ngModelChange)="changeUnit(config)">
        </div> 
        <div class="form-group">
            <label for="interval"><span>Interval (seconds)</span></label>
            <input type="number" *ngIf="!config.serverSide" class="form-control" id="interval" name="interval" min="30" placeholder="e.g. 5 (required)" required [(ngModel)]="config.interval" 
            (ngModelChange)="checkIntervalValidation();changeInterval(config);">
            <input type="number" *ngIf="config.serverSide" class="form-control" id="interval" name="interval" placeholder="e.g. 5 (required)" required [(ngModel)]="config.interval" 
            (ngModelChange)="checkIntervalValidation();changeInterval(config);">
            <label><span *ngIf="config.intervalInvalid" style="color:red;font-size:12px;"> Minimum 30 seconds interval required !</span></label>
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
export class WaveSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {

    constructor(private simConfigService: SimulatorConfigService) {
        super();
    }
    config: DtdlSimulationModel;

    getSelectedDevice(device: any) {
        this.config.alternateConfigs.opSource = device.id;
        this.config.alternateConfigs.opSourceName = device.name;
    }

    newOperation(base: string, index: number ) {

        let c: DtdlSimulationModel = {
            deviceId: "",
            matchingValue: `${base}_match_${index}`,
            fragment: this.config.fragment,
            series: this.config.series,
            waveType: 'sine',
            height: 10,
            wavelength: 60,
            unit: this.config.unit,
            interval: this.config.interval,
            alternateConfigs: undefined
        };

        this.config.alternateConfigs.operations.push(c);
    }

    initializeConfig(existingConfig?: DtdlSimulationModel) {

        let c: DtdlSimulationModel = {
            deviceId: "",
            matchingValue: "default",
            fragment: "temperature_measurement",
            series: "T",
            waveType: 'sine',
            height: 10,
            wavelength: 60,
            unit: "C",
            interval: 30,
            alternateConfigs: undefined
        };

        this.config = c;
        this.checkAlternateConfigs(c);

        if(typeof existingConfig != "undefined" || existingConfig != null) {
            c.fragment = existingConfig.fragment;
            c.series = existingConfig.series;
            c.waveType = existingConfig.waveType;
            c.height = existingConfig.height;
            c.wavelength = existingConfig.wavelength;
            c.unit = existingConfig.unit;
            c.interval = existingConfig.interval;
            c.alternateConfigs = _.cloneDeep(existingConfig.alternateConfigs);
        } else {
            //New objects can duplicate the default so it can be restored
            //we will create the config entries if old simulators are edited
            //duplication is to avoid changing old code.
            let copy : DtdlSimulationModel = _.cloneDeep(c);
            copy.alternateConfigs = undefined;
            this.config.alternateConfigs.operations.push(copy);
        }
        this.checkIntervalValidation();
    }

    // Patch fix for server side simulators
    changeFragment(model:any) {
        if( model.alternateConfigs &&  model.alternateConfigs.operations &&  model.alternateConfigs.operations.length > 0){
            model.alternateConfigs.operations.forEach(ops => {
                ops.fragment = model.fragment;
            });
        }
    }
    changeSeries(model:any) {
        if( model.alternateConfigs &&  model.alternateConfigs.operations &&  model.alternateConfigs.operations.length > 0){
            model.alternateConfigs.operations.forEach(ops => {
                ops.series = model.series;
            });
        }
    }
    changeUnit(model:any) {
        if( model.alternateConfigs &&  model.alternateConfigs.operations &&  model.alternateConfigs.operations.length > 0){
            model.alternateConfigs.operations.forEach(ops => {
                ops.unit = model.unit;
            });
        }
    }
    changeInterval(model:any) {
        if( model.alternateConfigs &&  model.alternateConfigs.operations &&  model.alternateConfigs.operations.length > 0){
            model.alternateConfigs.operations.forEach(ops => {
                ops.interval = model.interval;
            });
        }
    }

    checkIntervalValidation() {
        let serverSide;
        this.simConfigService.runOnServer$.subscribe((val) => {
            serverSide = val;
            if (!serverSide && this.config.interval < 30) {
                this.config.intervalInvalid = true;
            } else {
                this.config.intervalInvalid = false;
            }
        });
    }
}
