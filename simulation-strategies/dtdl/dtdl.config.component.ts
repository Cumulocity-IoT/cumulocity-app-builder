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
import { DtdlSimulationModel } from "builder/simulator/simulator-config";
import { cloneDeep } from "lodash";
import {SimulationStrategyConfigComponent} from "../../builder/simulator/simulation-strategy";
import * as _ from 'lodash';
import { SimulatorConfigService } from "../../builder/simulator-config/simulator-config.service";


@Component({
    template: `
        <div class="row" *ngIf="!config.isEditMode">
            <div class="col-xs-12 col-sm-5 col-md-5">
                <div class="form-group">
                    <label for="dtdlFile"><span>Upload a DTDL File</span></label>
                    <div style="display: inline-flex;">
                     <input type="file" class="form-control" id="dtdlFile" name="dtdlFile" (change)="fileUploaded($event)" accept=".json">
                     <div *ngIf="isUploading" style="color:blue;margin: 5px;"><i class="fa fa-circle-o-notch fa-spin"></i></div>
                    </div>
                    <div *ngIf="isError" style="color:red;">Invalid DTDL File!</div>
                </div>
                
            </div>
             <div class="col-xs-12 col-sm-4 col-md-4">
             <div class="form-group">
                <label for="name"><span>Name</span></label>
                <input type="text" class="form-control" id="name" name="name" placeholder="e.g. My First Simulator (required)" required autofocus [(ngModel)]="config.deviceName">
             </div>
            </div>
            <div class="col-xs-12 col-sm-3 col-md-3">
             <div class="form-group">
                <label for="name"><span>Filter</span></label>
                <button class="btn btn-xs" id="measurementFilterEnabled" name="measurementFilterEnabled" [(ngModel)]="measurementFilterEnabled" 
                (ngModelChange)="measurementFilterEnabledChange()" 
                btnCheckbox>{{measurementFilterEnabled? 'Telemetry' : 'All fields' }}</button>
            </div>
            </div>
            
        </div>
        <div class="form-group"  *ngIf="!config.isEditMode">
             <label for="dtdlDevice"><span>Select Measurements</span>  </label>
             <ng-select [items]="configModel" bindLabel="measurementName" name="measurementSelect" required [multiple]="true" [closeOnSelect]="false" [searchable]="true"
             placeholder="Select Measurements" [(ngModel)]="config.dtdlModelConfig" >
             </ng-select>
        </div>
        
        <div class="form-group">
            <accordion  [isAnimated]="true" [closeOthers]="true">
                <accordion-group panelClass="dtdl-simulator-measurement-panel"  *ngFor="let model of config.dtdlModelConfig;let index = index"  #dtdlGroup>
                    <button class="btn btn-link btn-block clearfix" accordion-heading type="button">
                        <div class="pull-left float-left">{{model.measurementName}}</div>
                        <span class="float-right pull-right"><i *ngIf="dtdlGroup.isOpen" class="fa fa-caret-up"></i>
                        <i *ngIf="!dtdlGroup.isOpen" class="fa fa-caret-down"></i></span>
                    </button>
                    <div class="col-xs-12 col-sm-4 col-md-4">
                        <div class="measurement-accordion">
                            <label for="simulationType"><span>Simulation Type</span></label>
                            <select name="simulationType{{model.id}}"  [(ngModel)]="model.simulationType" required  (ngModelChange)="changeSimulationType(model)">
                                <option value="randomValue" >Random Value</option>
                                <option value="valueSeries" >Value Series</option>
                                <option value="randomWalk" >Random Walk</option>
                                <option value="positionUpdate" >Position Update</option>
                                <option value="eventCreation" >Event Creation</option>
                            </select>
                        </div>     
                    </div>
                    <div class="col-xs-12 col-sm-4 col-md-4" *ngIf="!model.isFieldModel && model.simulationType !== 'positionUpdate' && model.simulationType !== 'eventCreation'">
                        <div class="measurement-accordion">
                            <label for="fragment"><span>Fragment</span></label>
                            <input type="text" class="form-control"  name="fragment{{model.id}}" placeholder="e.g. temperature_measurement (required)" required autofocus [(ngModel)]="model.fragment" (ngModelChange)="changeFragment(model)">
                        </div>
                    </div>
                    <div class="col-xs-12 col-sm-4 col-md-4" *ngIf="model.simulationType !== 'positionUpdate' && model.simulationType !== 'eventCreation'">
                        <div class="measurement-accordion">
                            <label for="series"><span>Series</span></label>
                            <input type="text" class="form-control" name="series{{model.id}}" placeholder="e.g. T (required)" required autofocus [(ngModel)]="model.series" (ngModelChange)="changeSeries(model)">
                        </div>
                    </div>

                    <ng-container [ngSwitch]="model.simulationType">
                        <ng-container *ngSwitchCase="'randomValue'">
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="minvalue"><span>Minimum Value</span></label>
                                    <input type="number" class="form-control"  name="minvalue{{model.id}}" placeholder="e.g. 10 (required)" required [(ngModel)]="model.alternateConfigs.operations[0].minValue">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="maxvalue"><span>Maximum Value</span></label>
                                    <input type="number" class="form-control"  name="maxvalue{{model.id}}" placeholder="e.g. 20 (required)" required [(ngModel)]="model.alternateConfigs.operations[0].maxValue">
                                </div>
                            </div>
                            <ng-container *ngIf="model.alternateConfigs.opEnabled">
                                <div class="col-xs-12 col-sm-4 col-md-4">
                                    <div class="measurement-accordion">
                                        <label for="match_{{model.id}}"><span>Matching</span></label>
                                        <input type="text" class="form-control" id="match_{{model.id}}" name="match_{{model.id}}" placeholder="e.g. WINDY" required [(ngModel)]="model.alternateConfigs.operations[0].matchingValue">
                                    </div>
                                </div>
                            </ng-container>
                        </ng-container>
                        <ng-container *ngSwitchCase="'positionUpdate'">
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="latitude"><span>Latitude Value</span></label>
                                    <input type="text" class="form-control"  name="latitude{{model.id}}" placeholder="e.g. 40.66,50.40 (required)" required [(ngModel)]="model.alternateConfigs.operations[0].latitude">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="altitude"><span>Altitude Value</span></label>
                                    <input type="text" class="form-control"  name="altitude{{model.id}}" placeholder="e.g. 40.66,50.40 (required)" required [(ngModel)]="model.alternateConfigs.operations[0].altitude">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="longitude"><span>Longitude value</span></label>
                                    <input type="text" class="form-control"  name="longitude{{model.id}}" placeholder="e.g. 40.66,50.40 (required)" required [(ngModel)]="model.alternateConfigs.operations[0].longitude">
                                </div>
                            </div>
                        </ng-container>
                        <ng-container *ngSwitchCase="'eventCreation'">
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="eventType"><span>Event Type</span></label>
                                    <input type="text" class="form-control"  name="eventType{{model.id}}" placeholder="c8y_locationUpdate,c8y_BeaconUpdate" required [(ngModel)]="model.alternateConfigs.operations[0].eventType">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="eventText"><span>Event Text</span></label>
                                    <input type="text" class="form-control"  name="eventText{{model.id}}" placeholder="c8y_locationUpdate,c8y_BeaconUpdate (required)" required [(ngModel)]="model.alternateConfigs.operations[0].eventText">
                                </div>
                            </div>
                        </ng-container>
                        <ng-container *ngSwitchCase="'valueSeries'">
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="value"><span>Value</span></label>
                                    <input type="text" class="form-control" id="value" name="value{{model.id}}" placeholder="e.g. 15,20,30 (required)" required [(ngModel)]="model.alternateConfigs.operations[0].value">
                                </div> 
                            </div>
                            <ng-container *ngIf="model.alternateConfigs.opEnabled">
                                <div class="col-xs-12 col-sm-4 col-md-4">
                                    <div class="measurement-accordion">
                                        <label for="match_{{model.id}}"><span>Matching</span></label>
                                        <input type="text" class="form-control" id="match_{{model.id}}" name="match_{{model.id}}" placeholder="e.g. WINDY" required [(ngModel)]="model.alternateConfigs.operations[0].matchingValue">
                                    </div>
                                </div>
                            </ng-container>
                        </ng-container>
                        <ng-container *ngSwitchCase="'randomWalk'">
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                <label for="startingvalue"><span>Starting Value</span></label>
                                <input type="number" class="form-control" id="startingvalue" name="startingvalue{{model.id}}" placeholder="e.g. 10 (required)" required [(ngModel)]="model.alternateConfigs.operations[0].startingValue">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="maxdelta"><span>Maximum Change Amount</span></label>
                                    <input type="number" class="form-control" id="maxdelta" name="maxdelta{{model.id}}" min="0" placeholder="e.g. 10 (required)" required [(ngModel)]="model.alternateConfigs.operations[0].maxDelta">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="minvalue"><span>Minimum Value</span></label>
                                    <input type="number" class="form-control"  name="minvalue{{model.id}}" placeholder="e.g. 10 (required)" required [(ngModel)]="model.alternateConfigs.operations[0].minValue">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="maxvalue"><span>Maximum Value</span></label>
                                    <input type="number" class="form-control"  name="maxvalue{{model.id}}" placeholder="e.g. 20 (required)" required [(ngModel)]="model.alternateConfigs.operations[0].maxValue">
                                </div>
                            </div>
                            <ng-container *ngIf="model.alternateConfigs.opEnabled">
                                <div class="col-xs-12 col-sm-4 col-md-4">
                                    <div class="measurement-accordion">
                                        <label for="match_{{model.id}}"><span>Matching</span></label>
                                        <input type="text" class="form-control" id="match_{{model.id}}" name="match_{{model.id}}" placeholder="e.g. WINDY" required [(ngModel)]="model.alternateConfigs.operations[0].matchingValue">
                                    </div>
                                </div>
                            </ng-container>
                        </ng-container>
                    </ng-container>

                    <div class="col-xs-12 col-lg-12" *ngIf="!config.isGroup && model.simulationType !== 'positionUpdate' && model.simulationType !== 'eventCreation' ">
                        <div class="measurement-accordion">
                            <label class="c8y-checkbox">
                                <input type="checkbox" name="opEnabled{{model.id}}" [(ngModel)]="model.alternateConfigs.opEnabled" (click)="checkDefaultOperation(model)"/>
                                <span></span>
                                <span>Controlled by operation</span>
                            </label>
                        </div>
                    </div>

                    <!-- start operation accordion --> 
                    <div class="col-xs-12 col-lg-12">   
                        <ng-container *ngIf="model.alternateConfigs.opEnabled">
                            <accordion  [isAnimated]="true" [closeOthers]="true">
                                <accordion-group panelClass="op-simulator-panel" #opGroup>
                                    <button class="btn btn-link btn-block clearfix" accordion-heading type="button">
                                        <div class="pull-left float-left">Operation details</div>
                                        <span class="float-right pull-right"><i *ngIf="opGroup.isOpen" class="fa fa-caret-up"></i>
                                        <i *ngIf="!opGroup.isOpen" class="fa fa-caret-down"></i></span>
                                    </button>
                                    <div class="col-xs-6 col-lg-6">
                                        <div class="measurement-accordion">
                                            <label for="opSource"><span>Operation Source</span></label>
                                            <device-selector id="opSource" name="opSource" [(value)]="model.alternateConfigs.opSourceName" [placeHolder]="'Type your Device Name'" [required]="true" (selectedDevice)= "getOperationDevice($event,model)"></device-selector>
                                        </div>
                                    </div>
                                    <div class="col-xs-6 col-lg-6">
                                        <div class="measurement-accordion">
                                            <label for="opPayload"><span>Payload Key</span></label>
                                            <input type="text" class="form-control" id="opPayload" name="opPayload" placeholder="e.g. c8y_command.text" required autofocus [(ngModel)]="model.alternateConfigs.payloadFragment">
                                        </div>
                                    </div>
                                    <div class="col-xs-12 col-lg-12">
                                        <div class="measurement-accordion">
                                            <label class="c8y-checkbox">
                                                <input type="checkbox" id="opReply" name="opReply" [(ngModel)]="model.alternateConfigs.opReply" />
                                                <span></span>
                                                <span>Mark operation handled</span>
                                            </label>
                                        </div>
                                    </div>
                                    <hr /> 
                                    <ng-container *ngFor="let op of model.alternateConfigs.operations; let i = index">
                                        <ng-container *ngIf="i > 0">
                                            <div class="col-xs-6 col-lg-6">
                                                <div class="measurement-accordion">
                                                    <label for="opMatch_{{i}}"><span>Matching</span></label>
                                                    <input type="text" class="form-control" id="opMatch{{model.id}}_{{i}}" name="opMatch{{model.id}}_{{i}}" placeholder="e.g. WINDY" required [(ngModel)]="op.matchingValue">
                                                </div>
                                            </div>
                                            <!-- must be the same as the default --> 
                                            <ng-container [ngSwitch]="model.simulationType">
                                                <ng-container *ngSwitchCase="'randomValue'">
                                                    <div class="col-xs-12 col-sm-4 col-md-4">
                                                        <div class="measurement-accordion">
                                                            <label for="minvalue"><span>Minimum Value</span></label>
                                                            <input type="number" class="form-control"  name="minvalue{{model.id}}_{{i}}" placeholder="e.g. 10 (required)" required [(ngModel)]="op.minValue">
                                                        </div>
                                                    </div>
                                                    <div class="col-xs-12 col-sm-4 col-md-4">
                                                        <div class="measurement-accordion">
                                                            <label for="maxvalue"><span>Maximum Value</span></label>
                                                            <input type="number" class="form-control"  name="maxvalue{{model.id}}_{{i}}" placeholder="e.g. 20 (required)" required [(ngModel)]="op.maxValue">
                                                        </div>
                                                    </div>
                                                </ng-container>
                                                <ng-container *ngSwitchCase="'positionUpdate'">
                                                    <div class="col-xs-12 col-sm-4 col-md-4">
                                                        <div class="measurement-accordion">
                                                            <label for="latitude"><span>Latitude Value</span></label>
                                                            <input type="text" class="form-control"  name="latitude{{model.id}}_{{i}}" placeholder="e.g. 40.66,50.40 (required)" required [(ngModel)]="op.latitude">
                                                        </div>
                                                    </div>
                                                    <div class="col-xs-12 col-sm-4 col-md-4">
                                                        <div class="measurement-accordion">
                                                            <label for="altitude"><span>Altitude Value</span></label>
                                                            <input type="text" class="form-control"  name="altitude{{model.id}}_{{i}}" placeholder="e.g. 40.66,50.40 (required)" required [(ngModel)]="op.altitude">
                                                        </div>
                                                    </div>
                                                    <div class="col-xs-12 col-sm-4 col-md-4">
                                                        <div class="measurement-accordion">
                                                            <label for="longitude"><span>Longitude value</span></label>
                                                            <input type="text" class="form-control"  name="longitude{{model.id}}_{{i}}" placeholder="e.g. 40.66,50.40 (required)" required [(ngModel)]="op.longitude">
                                                        </div>
                                                    </div>
                                                </ng-container>
                                                <ng-container *ngSwitchCase="'eventCreation'">
                                                    <div class="col-xs-12 col-sm-4 col-md-4">
                                                        <div class="measurement-accordion">
                                                            <label for="eventType"><span>Event Type</span></label>
                                                            <input type="text" class="form-control"  name="eventType{{model.id}}_{{i}}" placeholder="c8y_locationUpdate,c8y_BeaconUpdate" required [(ngModel)]="op.eventType">
                                                        </div>
                                                    </div>
                                                    <div class="col-xs-12 col-sm-4 col-md-4">
                                                        <div class="measurement-accordion">
                                                            <label for="eventText"><span>Event Text</span></label>
                                                            <input type="text" class="form-control"  name="eventText{{model.id}}_{{i}}" placeholder="c8y_locationUpdate,c8y_BeaconUpdate (required)" required [(ngModel)]="op.eventText">
                                                        </div>
                                                    </div>
                                                </ng-container>
                                                <ng-container *ngSwitchCase="'valueSeries'">
                                                    <div class="col-xs-12 col-sm-4 col-md-4">
                                                        <div class="measurement-accordion">
                                                            <label for="value"><span>Value</span></label>
                                                            <input type="text" class="form-control" id="value" name="value{{model.id}}_{{i}}" placeholder="e.g. 15,20,30 (required)" required [(ngModel)]="op.value">
                                                        </div> 
                                                    </div>
                                                </ng-container>
                                                <ng-container *ngSwitchCase="'randomWalk'">
                                                    <div class="col-xs-12 col-sm-4 col-md-6">
                                                        <div class="measurement-accordion">
                                                        <label for="startingvalue"><span>Starting Value</span></label>
                                                        <input type="number" class="form-control" id="startingvalue" name="startingvalue{{model.id}}_{{i}}" placeholder="e.g. 10 (required)" required [(ngModel)]="op.startingValue">
                                                        </div>
                                                    </div>
                                                    <div class="col-xs-12 col-sm-4 col-md-5">
                                                        <div class="measurement-accordion">
                                                            <label for="maxdelta"><span>Maximum Change Amount</span></label>
                                                            <input type="number" class="form-control" id="maxdelta" name="maxdelta{{model.id}}_{{i}}" min="0" placeholder="e.g. 10 (required)" required [(ngModel)]="op.maxDelta">
                                                        </div>
                                                    </div>
                                                    <div class="col-xs-12 col-sm-4 col-md-3">
                                                        <div class="measurement-accordion">
                                                            <label for="minvalue"><span>Minimum Value</span></label>
                                                            <input type="number" class="form-control"  name="minvalue{{model.id}}_{{i}}" placeholder="e.g. 10 (required)" required [(ngModel)]="op.minValue">
                                                        </div>
                                                    </div>
                                                    <div class="col-xs-12 col-sm-4 col-md-4">
                                                        <div class="measurement-accordion">
                                                            <label for="maxvalue"><span>Maximum Value</span></label>
                                                            <input type="number" class="form-control"  name="maxvalue{{model.id}}_{{i}}" placeholder="e.g. 20 (required)" required [(ngModel)]="op.maxValue">
                                                        </div>
                                                    </div>
                                                </ng-container>
                                            </ng-container>
                                            <div class="row">
                                                <div class="col-xs-12 col-lg-12">
                                                    <button class="btn btn-link btn-block" type="button" (click)="deleteDtDLOperation(model,i)">
                                                        <div class="pull-left float-left">Remove condition</div>
                                                    </button>
                                                </div>
                                                <div class="col-xs-12 col-lg-12">
                                                    <hr />   
                                                </div>
                                            </div>
                                        </ng-container>
                                    </ng-container>
                                    <button class="btn btn-link btn-block" type="button" (click)="newOperation(model,'dtdl_value',model.alternateConfigs.operations.length)">
                                        <div class="pull-left float-left">Add condition</div>
                                    </button>
                                </accordion-group>
                            </accordion>
                        </ng-container>
                    </div>
                    <!-- end operation accordion --> 

                    <div class="col-xs-12 col-sm-4 col-md-4" *ngIf="model.simulationType !== 'positionUpdate' && model.simulationType !== 'eventCreation'">
                        <div class="measurement-accordion">
                            <label for="unit"><span>Unit</span></label>
                            <input type="text" class="form-control"  name="unit{{model.id}}" placeholder="e.g. C (optional)" [(ngModel)]="model.unit"  (ngModelChange)="changeUnit(model)">
                        </div>        
                    </div>
                </accordion-group>
            </accordion>
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
        :host >>> .panel.dtdl-simulator-measurement-panel .panel-title{
            width: 100%;
        }
        .measurement-accordion {
            padding-bottom: 10px;
        }
        .measurement-accordion label {
            font-size: 12px;
        }
        .measurement-accordion input, .measurement-accordion select {
            font-size: 12px;
            height: 24px;
        }
        :host >>> device-selector > div > input {
            font-size: 12px !important;
            height: 24px !important;
        }
    `],
    viewProviders: [ { provide: ControlContainer, useExisting: NgForm } ]
})
export class DtdlSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {
    config: DtdlSimulationModel;
    configModel: DtdlSimulationModel[] = [];
    dtdlFile: FileList;
    isUploading = false;
    isError = false;
    measurementFilterEnabled = true;

    constructor(private simConfigService: SimulatorConfigService) {
        super();
    }

    existingConfig: any;

    private declareConfig() {
        this.config.modalSize = "modal-md";
        this.config.dtdlDeviceId = "";
        this.config.dtdlModelConfig = [];
        this.configModel = [];
        this.config.interval = 30;
        this.checkAlternateConfigs(this.config);
    }

    initializeConfig(existingConfig?: DtdlSimulationModel) {
        this.existingConfig = existingConfig;
        this.declareConfig();
        if(this.existingConfig === undefined || this.existingConfig === null) {
            this.config.interval = 30;
        } else {
            this.config.interval = this.existingConfig.interval;
            this.existingConfig.dtdlModelConfig.forEach((dmc: DtdlSimulationModel) => {
                this.checkAlternateConfigs(dmc);
                this.config.dtdlModelConfig.push(dmc);
            });
        }
    }

    public deleteDtDLOperation(model: DtdlSimulationModel, index:number) : void {
        if (_.has(model,"alternateConfigs") && _.has(model.alternateConfigs,"operations")) {
            let ops: Array<any> = _.get(model.alternateConfigs,"operations");
            ops.splice(index,1);
        }
    }

    public checkAlternateConfigs(target: DtdlSimulationModel) {
        if (!this.hasOperations(target)) {
            target.alternateConfigs = {
                opSource: "",
                opSourceName: "",
                payloadFragment: "c8y_Command.text",
                opReply: false,
                operations: [],
                configIndex: 0
            };

            if( !_.has(target, "matchingValue") ) {
                _.set(target, "matchingValue", `default`);    
            }

            target.alternateConfigs.operations.push(cloneDeep(target));
        }
    }

    getOperationDevice( event: any, model: DtdlSimulationModel) {
        model.alternateConfigs.opSource = event.id;
        model.alternateConfigs.opSourceName = event.name;
    }

    checkDefaultOperation(model) : void {
        if (!_.has(model,"alternateConfigs") && !_.has(model.alternateConfigs,"operations")) {
            model.alternateConfigs = {
                opSource: "",
                opSourceName: "",
                payloadFragment: "c8y_Command.text",
                opReply: false,
                configIndex: 0,
                operations: []
            };
        }    
        if( !_.has(model, "matchingValue") ) {
            _.set(model, "matchingValue", `default`);    
        }
    }

    newOperation(model: DtdlSimulationModel, base: string, index: number) {
        //        series: `${base}_series_${index}`,
        let c: DtdlSimulationModel = cloneDeep(model.alternateConfigs.operations[0]);
        _.set(c, "matchingValue", `${base}_match_${index}`);

        //New objects can duplicate the default so it can be restored
        //we will create the config entries if old simulators are edited
        //duplication is to avoid changing old code.
        model.alternateConfigs.operations.push(c);
    }

    fileUploaded(events){
        this.isError = false;
        this.isUploading = true;
        const file = events.target.files[0];
        const reader = new FileReader();
        let input = null;
        reader.addEventListener('load', (event: any) => {
            input = event.target.result;
            const validJson = this.isValidJson(input);
            if (validJson) {
                this.dtdlFile = validJson;
                this.processDTDL(validJson);
                this.preselectMeasurements();
            } else {
                this.isError = true;
                events.srcElement.value = "";
            }
            this.isUploading = false;
        });
        if(file) { 
            reader.readAsText(file);
        } else {
            this.isUploading = false;
        }
    }

    /**
     *
     * @param input Validate JSON Input
     */
    private isValidJson(input: any) {
        try {
            if (input) {
                const o = JSON.parse(input);
                if (o && (o.constructor === Object || o.constructor === Array)) {
                    return o;
                }
            }
        } catch (e) { }
        return false;
    }

    measurementFilterEnabledChange() {
        this.processDTDL(this.dtdlFile);
        this.preselectMeasurements();
    }

    private processDTDL(dtdl: any) {
        this.declareConfig();
        if(dtdl.constructor === Object) {
            this.config.deviceName = (dtdl.displayName && dtdl.displayName.constructor === Object ? dtdl.displayName.en : dtdl.displayName);
            this.processDTDLMeasurement(dtdl.contents);
        } else {
            dtdl.forEach( (device, idx) => {
                if(idx === 0) {
                    this.config.deviceName = (device.displayName && device.displayName.constructor === Object ? device.displayName.en : device.displayName);
                }
                this.processDTDLMeasurement(device.contents);
            });
        }
    }
    private processDTDLMeasurement(dtdlM: any, deviceId?: string) {
        if(dtdlM && dtdlM.length > 0) {
            const dtdlJSON: any = this.dtdlFile;
            dtdlM.forEach((content: any) => {
                if(content['@type'].includes("Telemetry")) {
                    this.processTelemetry(content, deviceId);
                } else if (content['@type'].includes("Component")) {
                    const schemaContent = (content.schema && content.schema.contents ? content.schema.contents : []);
                    schemaContent.forEach((content: any) => {
                        if(content['@type'].includes("Telemetry")) {
                            this.processTelemetry(content,deviceId);
                        } 
                    });
                    if(content.schema && content.schema.length > 0){
                        const locateContent = dtdlJSON.find( dtdlMsrmnt => dtdlMsrmnt['@id'] === content.schema);
                        if(locateContent && locateContent.contents && locateContent.contents.length > 0) {
                            const contents1stLevelObj = locateContent.contents;
                            contents1stLevelObj.forEach((content1stLevel: any) => {
                                if(content1stLevel['@type'].includes("Telemetry") || (!this.measurementFilterEnabled  && content1stLevel['@type'].includes("Property"))) {
                                    const level2DisplayName =  (content1stLevel.displayName && content1stLevel.displayName.constructor === Object ? content1stLevel.displayName.en : content1stLevel.displayName);
                                    const level1DisplayName = (content.displayName && content.displayName.constructor === Object ? content.displayName.en : content.displayName);
                                    this.processTelemetry(content1stLevel,deviceId, (level1DisplayName ? level1DisplayName + ':' + level2DisplayName : level2DisplayName));
                                } 
                            });
                        }
                    }
                }
            });
        }
    }

    private processTelemetry(content: any, deviceId?: string, displayName?: string) {
        const typeLength = (Array.isArray(content['@type']) ? content['@type'].length : 0);
        const model: DtdlSimulationModel = {
            simulationType: 'randomValue',
            matchingValue: "default",
            alternateConfigs: {
                opEnabled: false,
                opReply: false,
                opSource: "",
                opSourceName: "",
                payloadFragment: "c8y_Command.text",
                configIndex: 0,
                operations: []
            }
        };
        model.measurementName = (displayName  && displayName.length > 0 ? displayName : (content.displayName && content.displayName.constructor === Object ? content.displayName.en : content.displayName));
        model.fragment = ( typeLength > 0 ? content['@type'][typeLength - 1] : content['@type']);
        model.id = (content['@id'] ?  content['@id']: Math.floor(Math.random() * 1000000).toString());
        model.schema = content.schema;
        model.series = content.name;
        model.unit = content.unit;
        model.deviceId = deviceId;
        model.eventText = model.measurementName;
        model.eventType = content.name;
        model.isObjectType = (model.schema['@type'] === 'Object');
        if(model.isObjectType && model.schema.fields) {
            const fields = model.schema.fields;
            if(fields && fields.length > 0 ) {
                fields.forEach(field => {
                    const fieldModel: DtdlSimulationModel = {
                        simulationType: 'randomValue',
                        matchingValue: "default",
                        alternateConfigs: {
                            opEnabled: false,
                            opReply: false,
                            opSource: "",
                            opSourceName: "",
                            payloadFragment: "c8y_Command.text",
                            configIndex: 0,
                            operations: []
                        }            
                    };
                    fieldModel.measurementName = model.measurementName + " : " + field.displayName;
                    fieldModel.fragment = model.fragment;
                    fieldModel.id = (field['@id'] ?  field['@id']: Math.floor(Math.random() * 1000000).toString());
                    fieldModel.schema = field.schema;
                    fieldModel.series = content.name +":" + field.name;
                    fieldModel.unit = field.unit;
                    fieldModel.deviceId = deviceId;
                    fieldModel.isObjectType = false;
                    fieldModel.isFieldModel = true;
                    fieldModel.parentId = model.id;
                    fieldModel.eventText = fieldModel.measurementName;
                    fieldModel.eventType = field.name;
                    fieldModel.alternateConfigs.operations.push(cloneDeep(fieldModel));
                    this.configModel.push(fieldModel);
                });
            }
        } else  {
            this.configModel.push(model);
            this.checkAlternateConfigs(model)
            model.alternateConfigs.operations.push(cloneDeep(model));
        }
    }

    private preselectMeasurements() {
        if(this.existingConfig !== undefined && this.existingConfig !== null) {
            for(let i in this.existingConfig.dtdlModelConfig) {
                for(let j in this.configModel) {    
                    if(this.configModel[j].measurementName === this.existingConfig.dtdlModelConfig[i].measurementName) {
                        this.configModel[j] = this.existingConfig.dtdlModelConfig[i];
                        this.config.dtdlModelConfig.push(this.existingConfig.dtdlModelConfig[i]);
                    }
                }
            }
        }
    }

    // Patch fix for server side simulators
    changeSimulationType(model:any) {
        if( model.alternateConfigs &&  model.alternateConfigs.operations &&  model.alternateConfigs.operations.length > 0){
            model.alternateConfigs.operations.forEach(ops => {
                ops.simulationType = model.simulationType;
            });
        }
    }
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
