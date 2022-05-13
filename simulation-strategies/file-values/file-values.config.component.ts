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
    <div class="row" *ngIf="!config.isEditMode">
            <div class="col-xs-12 col-sm-4 col-md-4">
                <div class="form-group">
                    <label for="name"><span>Name</span></label>
                    <input type="text" class="form-control" id="name" name="name" placeholder="e.g. My First Simulator (required)" required autofocus [(ngModel)]="config.deviceName">
                </div>
            </div>
            <div class="col-xs-12 col-sm-3 col-md-3">
            <div class="form-group">
                <label for="headerPresent"><span>Column Header</span></label>
                <button class="btn btn-xs" id="headerPresent" name="headerPresent" [(ngModel)]="config.headerPresent" 
                (ngModelChange)="headerPresentChange()" 
                btnCheckbox>{{config?.headerPresent? 'First Row' : 'No Header' }}</button>
                </div>
            </div>
            <div class="col-xs-12 col-sm-5 col-md-5">
                <div class="form-group">
                        <label for="csvJsonFile"><span>Upload a File</span></label>
                        <div style="display: inline-flex;">
                        <input type="file" class="form-control" id="csvJsonFile" name="csvJsonFile" (change)="fileUploaded($event)" accept=".json,.csv;">
                        <div *ngIf="isUploading" style="color:blue;margin: 5px;"><i class="fa fa-circle-o-notch fa-spin"></i></div>
                        </div>
                        <div *ngIf="isError" style="color:red;">Invalid File Format!</div>
                </div>
            </div>
        </div>
        <div class="row" >
            <div class="col-xs-12 col-sm-4 col-md-4">
            <div class="form-group">
                <label for="generationType"><span>Category</span></label>
                <select name="generationType"  [(ngModel)]="config.generationType" required >
                    <option value="measurement" >Measurement</option>
                    <option value="event" >Event</option>
                </select>
                </div>
            </div>
            <div class="col-xs-12 col-sm-4 col-md-4">
            <div class="form-group">
                <label for="simulationType"><span>Simulation Type</span></label>
                <select name="simulationType"  [(ngModel)]="config.simulationType" required >
                    <option value="sequential" >Sequential</option>
                    <option value="random">Random</option>
                    <option value="steps"> +Steps </option>
                </select>
                </div>
            </div>
            <div class="col-xs-12 col-sm-4 col-md-4">
                <div class="form-group">
                    <label for="intervalType"><span>Interval Type</span></label>
                    <select name="intervalType"  [(ngModel)]="config.intervalType" required >
                        <option value="fixed">Fixed</option>
                        <option value="original" >Original</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="row" >
            <div class="col-xs-12 col-sm-4 col-md-4">
            <div class="form-group">
                <label for="loop"><span>Run in a Loop</span></label>
                <button class="btn btn-xs" id="loop" name="loop" [(ngModel)]="config.loop" 
                btnCheckbox>{{config?.loop? 'Yes' : 'No' }}</button>
                </div>
            </div>
            <div class="col-xs-12 col-sm-4 col-md-4" *ngIf="config.loop" >
            <div class="form-group">
                <label for="loopDelay"><span>Loop Delay</span></label>
                <input type="number" class="form-control" id="loopDelay" name="loopDelay" placeholder="e.g. 20 (required)" required [(ngModel)]="config.loopDelay">
                </div>
            </div>
            <div class="col-xs-12 col-sm-4 col-md-4" *ngIf="config.simulationType === 'steps'">
            <div class="form-group">
                <label for="stepValue"><span>Step Value</span></label>
                <input type="number" class="form-control" id="stepValue" name="stepValue" placeholder="e.g. 20 (required)" required [(ngModel)]="config.stepValue">
             </div>
            </div>
        </div>

        <div class="row">
            <div class="col-xs-12 col-sm-4 col-md-4">
                <div class="form-group" >
                    <label for="measurementType"><span>Select Type</span>  </label>
                    <ng-select [items]="config.fileColumns"  bindLabel="displayName" bindValue="value"  name="measurementType" required [multiple]="false" [closeOnSelect]="true" [searchable]="true"
                    placeholder="Type Column"  [addTag]="addCustomType" [(ngModel)]="config.alternateConfigs.operations[0].type" >
                    </ng-select>
                </div>
            </div>
            <div class="col-xs-12 col-sm-4 col-md-4">
                <div class="form-group" >
                    <label for="fragementType"><span>Select Fragement</span>  </label>
                    <ng-select [items]="config.fileColumns"  bindLabel="displayName" bindValue="value"  name="fragementType" required [multiple]="false" [closeOnSelect]="true" [searchable]="true"
                    placeholder="Fragement Column" [(ngModel)]="config.alternateConfigs.operations[0].fragment" >
                    </ng-select>
                </div>
            </div>
            <div class="col-xs-12 col-sm-4 col-md-4">
                <div class="form-group" >
                    <label for="dateTime"><span>Select TimeStamp</span>  </label>
                    <ng-select [items]="config.fileColumns" name="dateTime"  bindLabel="displayName" bindValue="value"  required [multiple]="false" [closeOnSelect]="true" [searchable]="true"
                    placeholder="TimeStamp Column" [(ngModel)]="config.alternateConfigs.operations[0].dateTime" >
                    </ng-select>
                </div>
            </div>
         </div>
        
        <div class="form-group">
            <label for="series"><span>Series column(s)</span></label>
            <ng-select [items]="config.fileColumns" bindLabel="displayName" bindValue="value" name="series" required [multiple]="true" [closeOnSelect]="false" [searchable]="true"
             placeholder="Select Series columns" [(ngModel)]="config.alternateConfigs.operations[0].series" >
             </ng-select>
        </div> 

        <div class="form-group">
            <label for="value"><span>Value column(s)</span></label>
            <ng-select [items]="config.fileColumns" name="value"  bindLabel="displayName" bindValue="value" required [multiple]="true" [closeOnSelect]="false" [searchable]="true"
             placeholder="Select Measurements value columns" [(ngModel)]="config.alternateConfigs.operations[0].value" >
             </ng-select>
        </div> 

        <div class="form-group">
            <label for="unit"><span>Unit column(s)</span></label>
            <ng-select [items]="config.fileColumns" name="unit" required [multiple]="true"  bindLabel="displayName" bindValue="value"  [closeOnSelect]="false" [searchable]="true"
             placeholder="Select Measurements unit columns" [(ngModel)]="config.alternateConfigs.operations[0].unit" >
             </ng-select>
        </div> 

         <div class="form-group">
            <label for="interval"><span>Interval (seconds)</span></label>
            <input type="number" class="form-control" id="interval" name="interval" placeholder="e.g. 10 (required)" required [(ngModel)]="config.interval" (ngModelChange)="changeInterval(config)">
        </div>  
    `
})
export class FileValuesSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {

    config: DtdlSimulationModel;
    isUploading = false;
    isError = false;
    firstLine = '';
    addCustomType = (term: string) => ({ 'displayName' : term, 'value' : term, 'tag' : 'type'});
    initializeConfig(existingConfig?: DtdlSimulationModel) {
        let c: DtdlSimulationModel = {
            deviceId: "",
            matchingValue: "default",
            latitude: "",
            longitude: "",
            altitude: "",
            interval: 30,
            alternateConfigs: undefined
        };
        this.config.modalSize = "modal-md";

        this.checkAlternateConfigs(c);

        //TODO: copy alternateconfigs
        if( existingConfig ) {
            c.interval = existingConfig.interval;
            c.latitude = existingConfig.latitude;
            c.longitude = existingConfig.longitude;
            c.altitude = existingConfig.altitude;
            c.alternateConfigs = _.cloneDeep(existingConfig.alternateConfigs);
        } else {
            //New objects can duplicate the default so it can be restored
            //we will create the config entries if old simulators are edited
            //duplication is to avoid changing old code.
            let copy : DtdlSimulationModel = _.cloneDeep(c);
            copy.alternateConfigs = undefined;
            c.alternateConfigs.operations.push(copy);
        }
        this.config = c;
    }

    fileUploaded(events){
        this.isError = false;
        this.isUploading = true;
        const file = events.target.files[0];
        const fileType = file.type;
        console.log('file type', fileType);
        const reader = new FileReader();
        let input = null;
        reader.addEventListener('load', (event: any) => {
            input = event.target.result;
            if(file && file.type && file.type.toLowerCase().includes('csv')) {
                this.firstLine = (input.toString().replace(/\r\n/g,'\n').split('\n'))[0];
                this.config.type = 'CSV';
                this.loadFieldColumns();
            } else  {
                this.config.type = 'JSON';
                // TODO for json file
            }
            console.log('file data', input);
            /* const validJson = this.isValidJson(input);
            if (validJson) {
                this.dtdlFile = validJson;
                this.processDTDL(validJson);
                this.preselectMeasurements();
            } else {
                this.isError = true;
                events.srcElement.value = "";
            } */
            this.isUploading = false;
        });
        if(file) { 
            reader.readAsText(file);
        } else {
            this.isUploading = false;
        }
    }

    private loadFieldColumns() {
        this.config.fileColumns = [];
        if(this.firstLine) {
            if(this.config && this.config.headerPresent) {
                const fieldList = this.firstLine.split(",");
                if(fieldList && fieldList.length > 0) {
                    fieldList.forEach( (field, index) => {
                        this.config.fileColumns.push( {
                            "displayName": field,
                            "value": 'column' + index
                        }); 
                    });
                }
                console.log(this.config.fileColumns);
            } else {
                const colList = this.firstLine.split(",");
                if(colList && colList.length > 0) {
                    colList.forEach( (col, index) => {
                        this.config.fileColumns.push( {
                            "displayName": 'column-' + index,
                            "value": 'column' + index
                        }); 
                    });
                }
            }
        }
    }

    headerPresentChange() {
        if(this.config && this.config?.alternateConfigs?.operations[0]) {
            this.config.alternateConfigs.operations[0].type = '';
            this.config.alternateConfigs.operations[0].fragment = '';
            this.config.alternateConfigs.operations[0].series = '';
            this.config.alternateConfigs.operations[0].value = '';
            this.config.alternateConfigs.operations[0].unit = '';
            this.config.alternateConfigs.operations[0].dateTime = '';

        }
        this.loadFieldColumns();
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


     // Patch fix for server side simulators
     applyValuetoOperations(model:any) {
        model.alternateConfigs.operations[0].latitude = model.latitude;
        model.alternateConfigs.operations[0].altitude = model.altitude;
        model.alternateConfigs.operations[0].longitude = model.longitude;
    }
    changeInterval(model:any) {
        model.alternateConfigs.operations[0].interval = model.interval;
    }
}