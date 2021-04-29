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

export interface DtdlSimulationStrategyConfig {
    deviceId: string,
    modalSize?: string,
    deviceName: string,
    dtdlDeviceId: string,
    dtdlModelConfig: DtdlSimulationModel[],
    interval: number
}

export interface DtdlSimulationModel {
    measurementName?: string,
    fragment?: string,
    series?: string,
    unit?: string,
    schema?: any,
    id?: string,
    minValue?: number, // random value, random walk
    maxValue?: number, // random value, random walk
    value?: string, // value series
    startingValue?: number, // random walk
    maxDelta?: number, // random walk
    latitude?: string, // position update
    longitude?: string, // position update
    altitude?: string, // position update
    deviceId?: string;
    simulationType?: string;
    isObjectType?: boolean;
    parentId?: string;
    isFieldModel?: boolean;
}
@Component({
    template: `
    
        <div class="row" *ngIf="!config.isEditMode">
            <div class="col-xs-12 col-sm-6 col-md-6">
                <div class="form-group">
                    <label for="dtdlFile"><span>Upload a DTDL File</span></label>
                    <div style="display: inline-flex;">
                     <input type="file" class="form-control" id="dtdlFile" name="dtdlFile" (change)="fileUploaded($event)" accept=".json">
                     <div *ngIf="isUploading" style="color:blue;margin: 5px;"><i class="fa fa-circle-o-notch fa-spin"></i></div>
                    </div>
                    <div *ngIf="isError" style="color:red;">Invalid DTDL File!</div>
                </div>
                
            </div>
             <div class="col-xs-12 col-sm-6 col-md-6">
             <div class="form-group">
                <label for="name"><span>Name</span></label>
                <input type="text" class="form-control" id="name" name="name" placeholder="e.g. My First Simulator (required)" required autofocus [(ngModel)]="config.deviceName">
             </div>
            </div>
            
        </div>
        <div class="form-group"  *ngIf="!config.isEditMode">
             <label for="dtdlDevice"><span>Select Measurements</span></label>
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
                            <select name="simulationType{{model.id}}"  [(ngModel)]="config.dtdlModelConfig[index].simulationType" required >
                                <option value="randomValue" >Random Value</option>
                                <option value="valueSeries" >Value Series</option>
                                <option value="randomWalk" >Random Walk</option>
                                <option value="positionUpdate" >Position Update</option>
                            </select>
                        </div>     
                    </div>
                    <div class="col-xs-12 col-sm-4 col-md-4" *ngIf="!config.dtdlModelConfig[index].isFieldModel && config.dtdlModelConfig[index].simulationType !== 'positionUpdate'">
                    <div class="measurement-accordion">
                        <label for="fragment"><span>Fragment</span></label>
                        <input type="text" class="form-control"  name="fragment{{model.id}}" placeholder="e.g. temperature_measurement (required)" required autofocus [(ngModel)]="config.dtdlModelConfig[index].fragment">
                    </div>
                    </div>
                    <div class="col-xs-12 col-sm-4 col-md-4" *ngIf="config.dtdlModelConfig[index].simulationType !== 'positionUpdate'">
                        <div class="measurement-accordion">
                            <label for="series"><span>Series</span></label>
                            <input type="text" class="form-control" name="series{{model.id}}" placeholder="e.g. T (required)" required autofocus [(ngModel)]="config.dtdlModelConfig[index].series">
                        </div>
                    </div>
                    <ng-container [ngSwitch]="config.dtdlModelConfig[index].simulationType">
                        <ng-container *ngSwitchCase="'randomValue'">
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="minvalue"><span>Minimum Value</span></label>
                                    <input type="number" class="form-control"  name="minvalue{{model.id}}" placeholder="e.g. 10 (required)" required [(ngModel)]="config.dtdlModelConfig[index].minValue">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="maxvalue"><span>Maximum Value</span></label>
                                    <input type="number" class="form-control"  name="maxvalue{{model.id}}" placeholder="e.g. 20 (required)" required [(ngModel)]="config.dtdlModelConfig[index].maxValue">
                                </div>
                            </div>
                        </ng-container>
                        <ng-container *ngSwitchCase="'positionUpdate'">
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="latitude"><span>Latitude Value</span></label>
                                    <input type="text" class="form-control"  name="latitude{{model.id}}" placeholder="e.g. 40.66,50.40 (required)" required [(ngModel)]="config.dtdlModelConfig[index].latitude">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="altitude"><span>Altitude Value</span></label>
                                    <input type="text" class="form-control"  name="altitude{{model.id}}" placeholder="e.g. 40.66,50.40 (required)" required [(ngModel)]="config.dtdlModelConfig[index].altitude">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="longitude"><span>Longitude value</span></label>
                                    <input type="text" class="form-control"  name="longitude{{model.id}}" placeholder="e.g. 40.66,50.40 (required)" required [(ngModel)]="config.dtdlModelConfig[index].longitude">
                                </div>
                            </div>
                        </ng-container>
                        <ng-container *ngSwitchCase="'valueSeries'">
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="value"><span>Value</span></label>
                                    <input type="text" class="form-control" id="value" name="value{{model.id}}" placeholder="e.g. 15,20,30 (required)" required [(ngModel)]="config.dtdlModelConfig[index].value">
                                </div> 
                            </div>
                        </ng-container>
                        <ng-container *ngSwitchCase="'randomWalk'">
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                <label for="startingvalue"><span>Starting Value</span></label>
                                <input type="number" class="form-control" id="startingvalue" name="startingvalue{{model.id}}" placeholder="e.g. 10 (required)" required [(ngModel)]="config.dtdlModelConfig[index].startingValue">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="maxdelta"><span>Maximum Change Amount</span></label>
                                    <input type="number" class="form-control" id="maxdelta" name="maxdelta{{model.id}}" min="0" placeholder="e.g. 10 (required)" required [(ngModel)]="config.dtdlModelConfig[index].maxDelta">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="minvalue"><span>Minimum Value</span></label>
                                    <input type="number" class="form-control"  name="minvalue{{model.id}}" placeholder="e.g. 10 (required)" required [(ngModel)]="config.dtdlModelConfig[index].minValue">
                                </div>
                            </div>
                            <div class="col-xs-12 col-sm-4 col-md-4">
                                <div class="measurement-accordion">
                                    <label for="maxvalue"><span>Maximum Value</span></label>
                                    <input type="number" class="form-control"  name="maxvalue{{model.id}}}" placeholder="e.g. 20 (required)" required [(ngModel)]="config.dtdlModelConfig[index].maxValue">
                                </div>
                            </div>
                        </ng-container>
                    </ng-container>
                    <div class="col-xs-12 col-sm-4 col-md-4" *ngIf="config.dtdlModelConfig[index].simulationType !== 'positionUpdate'">
                        <div class="measurement-accordion">
                            <label for="unit"><span>Unit</span></label>
                            <input type="text" class="form-control"  name="unit{{model.id}}" placeholder="e.g. C (optional)" [(ngModel)]="config.dtdlModelConfig[index].unit">
                        </div>        
                    </div>
                </accordion-group>
            </accordion>
        </div>
        <div class="form-group">
            <label for="interval"><span>Interval (seconds)</span></label>
            <input type="number" class="form-control" id="interval" name="interval" placeholder="e.g. 5 (required)" required [(ngModel)]="config.interval">
        </div>
    `,
    styles: [ `
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

    `],
    viewProviders: [ { provide: ControlContainer, useExisting: NgForm } ]
})
export class DtdlSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {
    config: DtdlSimulationStrategyConfig;
    configModel: DtdlSimulationModel[] = [];
    dtdlFile: FileList;
    isUploading = false;
    isError = false;
    initializeConfig() {
        this.config.modalSize = "modal-md",
        this.config.dtdlModelConfig = [];
        this.config.dtdlDeviceId = "";
        this.configModel = [];
        this.config.interval = 5;
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
            } else {
                this.isError = true;
                events.srcElement.value = "";
            }
            this.isUploading = false;
        });
        if(file) { reader.readAsText(file); } 
        else {  this.isUploading = false;   }
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


    private processDTDL(dtdl: any) {
        this.initializeConfig();
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
                }
            });
        }
    }

    private processTelemetry(content: any, deviceId?: string) {
        const typeLength = (Array.isArray(content['@type']) ? content['@type'].length : 0);
        const model: DtdlSimulationModel = {
            simulationType: 'randomValue'
        };
        model.measurementName = (content.displayName && content.displayName.constructor === Object ? content.displayName.en : content.displayName);
        model.fragment = ( typeLength > 0 ? content['@type'][typeLength - 1] : content['@type']);
        model.id = (content['@id'] ?  content['@id']: Math.floor(Math.random() * 1000000));
        model.schema = content.schema;
        model.series = content.name;
        model.unit = content.unit;
        model.deviceId = deviceId;
        model.isObjectType = (model.schema['@type'] === 'Object');
        if(model.isObjectType && model.schema.fields) {
            const fields = model.schema.fields;
            if(fields && fields.length > 0 ) {
                fields.forEach(field => {
                    const fieldModel: DtdlSimulationModel = {
                        simulationType: 'randomValue'
                    };
                    fieldModel.measurementName = model.measurementName + " : " + field.displayName;
                    fieldModel.fragment = model.fragment;
                    fieldModel.id = (field['@id'] ?  field['@id']: Math.floor(Math.random() * 1000000));
                    fieldModel.schema = field.schema;
                    fieldModel.series = content.name +":" + field.name;
                    fieldModel.unit = field.unit;
                    fieldModel.deviceId = deviceId;
                    fieldModel.isObjectType = false;
                    fieldModel.isFieldModel = true;
                    fieldModel.parentId = model.id;
                    this.configModel.push(fieldModel);
                });
            }
        } else  {
            this.configModel.push(model);
        }
        
    }
}
