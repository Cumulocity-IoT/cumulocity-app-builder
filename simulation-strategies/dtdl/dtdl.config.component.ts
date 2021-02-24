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
    schema?: string,
    id?: string,
    minValue?: number,
    maxValue?: number,
    deviceId?: string;
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
                <label for="dtdlDevice"><span>Select Device</span></label>
                <select name="dtdlDevice" id="dtdlDevice" [(ngModel)]="config.dtdlDeviceId" required (change)="onSelectedDtdlDevice()">
                        <option *ngFor="let device of deviceList"  [value]="device.deviceId">{{device.deviceName}}</option>
                </select>
             </div>
            </div>
        </div>
        
        <div class="row">
                
        </div>
        <div class="row form-group">
            <accordion  [isAnimated]="true" [closeOthers]="true">
                <accordion-group  *ngFor="let model of config.dtdlModelConfig;let index = index"  #dtdlGroup>
                    <button class="btn btn-link btn-block clearfix" accordion-heading type="button">
                        <div class="pull-left float-left">{{model.measurementName}}</div>
                        <span class="float-right pull-right"><i *ngIf="dtdlGroup.isOpen" class="fa fa-caret-up"></i>
                        <i *ngIf="!dtdlGroup.isOpen" class="fa fa-caret-down"></i></span>
                    </button>
                    <div class="col-xs-12 col-sm-6 col-md-6">
                    <div class="form-group">
                        <label for="fragment"><span>Fragment</span></label>
                        <input type="text" class="form-control"  name="fragment{{index}}" placeholder="e.g. temperature_measurement (required)" required autofocus [(ngModel)]="config.dtdlModelConfig[index].fragment">
                    </div>
                    </div>
                    <div class="col-xs-12 col-sm-6 col-md-6">
                        <div class="form-group">
                            <label for="series"><span>Series</span></label>
                            <input type="text" class="form-control" name="series{{index}}" placeholder="e.g. T (required)" required autofocus [(ngModel)]="config.dtdlModelConfig[index].series">
                        </div>
                    </div>
                    <div class="col-xs-12 col-sm-6 col-md-6">
                        <div class="form-group">
                            <label for="minvalue"><span>Minimum Value</span></label>
                            <input type="number" class="form-control"  name="minvalue{{index}}" placeholder="e.g. 10 (required)" required [(ngModel)]="config.dtdlModelConfig[index].minValue">
                        </div>
                    </div>
                    <div class="col-xs-12 col-sm-6 col-md-6">
                        <div class="form-group">
                            <label for="maxvalue"><span>Maximum Value</span></label>
                            <input type="number" class="form-control"  name="maxvalue{{index}}" placeholder="e.g. 20 (required)" required [(ngModel)]="config.dtdlModelConfig[index].maxValue">
                        </div>
                    </div>
                    <div class="col-xs-12 col-sm-6 col-md-6">
                        <div class="form-group">
                            <label for="unit"><span>Unit</span></label>
                            <input type="text" class="form-control"  name="unit{{index}}" placeholder="e.g. C (optional)" [(ngModel)]="config.dtdlModelConfig[index].unit">
                        </div>        
                    </div>
                    <div class="col-xs-12 col-sm-6 col-md-6">
                        
                    </div>
                </accordion-group>
            </accordion>
        </div>
        <div class="form-group">
            <label for="interval"><span>Interval (seconds)</span></label>
            <input type="number" class="form-control" id="interval" name="interval" placeholder="e.g. 5 (required)" required [(ngModel)]="config.interval">
        </div>
    `,
    viewProviders: [ { provide: ControlContainer, useExisting: NgForm } ]
})
export class DtdlSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {
    config: DtdlSimulationStrategyConfig;
    configModel: DtdlSimulationModel[] = [];
    deviceList: any = [];
    dtdlFile: FileList;
    isUploading = false;
    isError = false;
    initializeConfig() {
        this.config.modalSize = "modal-md",
        this.config.dtdlModelConfig = [];
        this.config.dtdlDeviceId = "";
        this.configModel = [];
        this.deviceList = [{
            deviceId: "",
            deviceName: "--Select--"
        }]
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
        reader.readAsText(file);
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

    onSelectedDtdlDevice() {
        console.log('selected deviceId', this.config.dtdlDeviceId);
        const measurementObj = this.configModel.filter((model) => model.deviceId === this.config.dtdlDeviceId);
        this.config.dtdlModelConfig = [];
        this.config.dtdlModelConfig = Object.assign(this.config.dtdlModelConfig, measurementObj);
        console.log('updated config', this.config);
    }
    private processDTDL(dtdl: any) {
        this.initializeConfig();
        if(dtdl.constructor === Object) {
            this.deviceList.push({
                deviceId: dtdl['@id'],
                deviceName: dtdl.displayName
            });
            this.processDTDLMeasurement(dtdl.contents, dtdl['@id']);
        } else {
            dtdl.forEach(device => {
                this.deviceList.push({
                    deviceId: device['@id'],
                    deviceName: (device.displayName && device.displayName.constructor === Object ? device.displayName.en : device.displayName)
                });
                this.processDTDLMeasurement(device.contents, device['@id']);
            });
        }
        console.log('model', this.configModel);
    }
    private processDTDLMeasurement(dtdlM: any, deviceId: string) {
        if(dtdlM && dtdlM.length > 0) {
            dtdlM.forEach((content: any) => {
                if(content['@type'].includes("Telemetry")) {
                    const typeLength = (Array.isArray(content['@type']) ? content['@type'].length : 0);
                    const model: DtdlSimulationModel = {};
                    model.measurementName = (content.displayName && content.displayName.constructor === Object ? content.displayName.en : content.displayName);
                    model.fragment = ( typeLength > 0 ? content['@type'][typeLength - 1] : content['@type']);
                    model.id = content['@id'];
                    model.schema = content.schema;
                    model.series = content.name;
                    model.unit = content.unit;
                    model.deviceId = deviceId;
                    this.configModel.push(model);
                }
            });
        }
    }
}
