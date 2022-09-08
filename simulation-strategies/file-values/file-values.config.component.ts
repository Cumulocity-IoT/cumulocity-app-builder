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
import { ControlContainer, NgForm } from "@angular/forms";
import { AlertService } from "@c8y/ngx-components";
import { SimulatorConfigService } from "../../builder/simulator-config/simulator-config.service";

@Component({
    template: `
    <div class="row" *ngIf="!config.isEditMode">
            <div class="col-xs-12 col-sm-4 col-md-4">
                <div class="form-group">
                    <label for="name"><span>Name</span></label>
                    <input type="text" class="form-control" id="name" name="name" placeholder="e.g. My First Simulator (required)" required autofocus [(ngModel)]="config.deviceName">
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
            <div class="col-xs-12 col-sm-3 col-md-3" *ngIf="config.type === 'CSV'">
                <div class="form-group">
                    <label for="headerPresent"><span>Column Header</span></label>
                    <button class="btn btn-xs" id="headerPresent" name="headerPresent" [(ngModel)]="config.headerPresent" 
                    (ngModelChange)="headerPresentChange()" 
                    btnCheckbox>{{config?.headerPresent? 'First Row' : 'No Header' }}</button>
                </div>
            </div>
        </div>
        <div class="row" >
            <div class="col-xs-12 col-sm-4 col-md-4">
            <div class="form-group">
                <label for="generationType"><span>Category</span></label>
                <select name="generationType"  id="generationType" [(ngModel)]="config.generationType" (ngModelChange)="generationTypeChange()" required placeholder="select Catagory">
                    <option value="measurement" >Measurement</option>
                    <option value="event" >Event</option>
                </select>
                </div>
            </div>
            <div class="col-xs-12 col-sm-4 col-md-4">
            <div class="form-group">
                <label for="simulationType"><span>Simulation Type</span></label>
                <select name="simulationType" id="simulationType" [(ngModel)]="config.simulationType" required placeholder="Simulation Type">
                    <option value="sequential" >Sequential</option>
                    <option value="random">Random</option>
                    <option value="steps"> +Steps </option>
                </select>
                </div>
            </div>
            <div class="col-xs-12 col-sm-4 col-md-4">
                <div class="form-group">
                    <label for="intervalType"><span>Interval Type</span></label>
                    <select name="intervalType" id="intervalType" [(ngModel)]="config.intervalType" required placeholder="Interval Type" (ngModelChange)="changeIntervalType()">
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
                <div class="form-group" *ngIf="config.generationType === 'measurement'">
                    <label for="measurementType"><span>Select Type</span>  </label>
                    <ng-select [items]="config.typeColumns"  bindLabel="displayName" bindValue="value" id="measurementType" name="measurementType" required [multiple]="false" [closeOnSelect]="true" [searchable]="true"
                    placeholder="Type Column"  [appendTo]="(appendTo ?  appendTo : 'body')" [addTag]="addCustomType" [(ngModel)]="config.alternateConfigs.operations[0].type" >
                    </ng-select>
                </div>
                <div class="form-group" *ngIf="config.generationType === 'event'">
                    <label for="eventType"><span>Event Type</span>  </label>
                    <ng-select [items]="config.eventTypeColumns"  bindLabel="displayName" bindValue="value"  id="eventType"  name="eventType" required [multiple]="false" [closeOnSelect]="true" [searchable]="true"
                    placeholder="Event Type" [appendTo]="(appendTo ?  appendTo : 'body')" [addTag]="addCustomEventType" [(ngModel)]="config.alternateConfigs.operations[0].eventType" >
                    </ng-select>
                </div>
            </div>
            <div class="col-xs-12 col-sm-4 col-md-4">
                <div class="form-group" *ngIf="config.generationType === 'measurement'">
                    <label for="fragementType"><span>Select Fragement</span>  </label>
                    <ng-select *ngIf="config.type !== 'JSON'"  [items]="config.fragmentColumns"  bindLabel="displayName" bindValue="value"  id="fragementType"  name="fragementType" required [multiple]="false" [closeOnSelect]="true" [searchable]="true"
                    placeholder="Fragement Type" [appendTo]="(appendTo ?  appendTo : 'body')" [addTag]="addCustomFragment" [(ngModel)]="config.alternateConfigs.operations[0].fragment" >
                    </ng-select>
                    <ng-select *ngIf="config.type === 'JSON'" [items]="config.fragmentColumns"  bindLabel="displayName" bindValue="value"  id="fragementType" name="fragementType" required [multiple]="false" [closeOnSelect]="true" [searchable]="true"
                    placeholder="Fragement Type" [appendTo]="(appendTo ?  appendTo : 'body')"  [(ngModel)]="config.alternateConfigs.operations[0].fragment" >
                    </ng-select>
                </div>
                <div class="form-group" *ngIf="config.generationType === 'event'">
                    <label for="eventText"><span>Select Event Text</span>  </label>
                    <ng-select [items]="config.fileColumns"  bindLabel="displayName" bindValue="value"  id="eventText" name="eventText" required [multiple]="false" [closeOnSelect]="true" [searchable]="true"
                    placeholder="Event Text" [(ngModel)]="config.alternateConfigs.operations[0].eventText"  [appendTo]="(appendTo ?  appendTo : 'body')">
                    </ng-select>
                </div>
            </div>
            <div class="col-xs-12 col-sm-4 col-md-4" >
                <div class="form-group">
                    <label for="interval"><span>Interval (seconds)</span></label>
                    <input type="number" *ngIf="!config.serverSide" class="form-control" id="interval" name="interval" min="30" placeholder="e.g. 5 (required)" required [(ngModel)]="config.interval" 
                    (ngModelChange)="checkIntervalValidation();changeInterval(config);">
                    <input type="number" *ngIf="config.serverSide" class="form-control" id="interval" name="interval" placeholder="e.g. 5 (required)" required [(ngModel)]="config.interval" 
                    (ngModelChange)="checkIntervalValidation();changeInterval(config);">
                    <label><span *ngIf="config.intervalInvalid" style="color:red;font-size:12px;"> Minimum 30 seconds interval required !</span></label>
                </div> 
            </div>
         </div>
        
        <div class="row" *ngIf="config.generationType === 'measurement'">
            <div class="col-xs-12 col-sm-6 col-md-6">
                <div class="form-group">
                    <label for="series"><span>Series </span></label>
                    <ng-select [items]="config.fileColumns" bindLabel="displayName" bindValue="value" id="series" name="series" required [multiple]="true" [closeOnSelect]="false" [searchable]="true"
                    placeholder="Select Series(s)" [appendTo]="(appendTo ?  appendTo : 'body')"  [(ngModel)]="config.alternateConfigs.operations[0].series" >
                    </ng-select>
                </div> 
            </div>
            <div class="col-xs-12 col-sm-6 col-md-6">
                <div class="form-group" *ngIf="config.type === 'CSV'">
                    <label for="value"><span>Value </span></label>
                    <ng-select [items]="config.fileColumns" id="value" name="value"  bindLabel="displayName" bindValue="value" required [multiple]="true" [closeOnSelect]="false" [searchable]="true"
                    placeholder="Select Measurements value(s)" [appendTo]="(appendTo ?  appendTo : 'body')" [(ngModel)]="config.alternateConfigs.operations[0].value" >
                    </ng-select>
                </div> 
            </div>
        </div>
        <div class="row">
            <div class="col-xs-12 col-sm-6 col-md-6"  *ngIf="config.type === 'CSV' && config.generationType === 'measurement'">
                <div class="form-group">
                    <label for="unit"><span>Unit </span></label>
                    <ng-select [items]="config.fileColumns" id="unit" name="unit" required [multiple]="true"  bindLabel="displayName" bindValue="value"  [closeOnSelect]="false" [searchable]="true"
                    placeholder="Select Measurements unit(s)" [appendTo]="(appendTo ?  appendTo : 'body')" [(ngModel)]="config.alternateConfigs.operations[0].unit" >
                    </ng-select>
                </div> 
            </div>
            <div class="col-xs-12 col-sm-6 col-md-6" *ngIf="config.intervalType === 'original'">
                <div class="form-group" >
                        <label for="dateTime"><span>Select Timestamp</span>  </label>
                        <ng-select [items]="config.fileColumns" id="dateTime" name="dateTime"  bindLabel="displayName" bindValue="value"  required [multiple]="false" [closeOnSelect]="true" [searchable]="true"
                        placeholder="TimeStamp" [appendTo]="(appendTo ?  appendTo : 'body')" [(ngModel)]="config.alternateConfigs.operations[0].dateTime" >
                        </ng-select>
                    </div>    
            </div>
        </div>  
    `,
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class FileValuesSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {

    config: DtdlSimulationModel;
    isUploading = false;
    isError = false;
    firstLine = '';
    jsonData = null;

    constructor(private alertService: AlertService, private simConfigService: SimulatorConfigService) {
        super();
    }
    addCustomType = (term: string) => this.addCustomTypeField(term);
    addCustomFragment = (term: string) => this.addCustomFragmentField(term);
    addCustomEventType = (term: string) => this.addCustomEventTypeField(term);

    addCustomTypeField(term: string) {
        const newField = { 'displayName': term, 'value': term, 'tag': 'type' };
        this.config.typeColumns.push(newField);
        return newField;

    };

    addCustomFragmentField(term: string) {
        const newField = { 'displayName': term, 'value': term, 'tag': 'fragment' };
        this.config.fragmentColumns.push(newField);
        return newField;
    };

    addCustomEventTypeField(term: string) {
        const newField = { 'displayName': term, 'value': term, 'tag': 'eventType' };
        this.config.eventTypeColumns.push(newField);
        return newField;

    }
    initializeConfig(existingConfig?: DtdlSimulationModel) {
        let c: DtdlSimulationModel = {
            deviceId: "",
            matchingValue: "default",
            interval: 30,
            alternateConfigs: undefined
        };

        this.checkAlternateConfigs(c);

        if (existingConfig) {
            c.alternateConfigs = _.cloneDeep(existingConfig.alternateConfigs);
        } else {
            let copy: DtdlSimulationModel = _.cloneDeep(c);
            copy.alternateConfigs = undefined;
            c.alternateConfigs.operations.push(copy);
        }
        this.config = c;
        this.config.modalSize = "modal-md";
        this.config.generationType = 'measurement'
        this.config.headerPresent = false;
        this.checkIntervalValidation();
    }

    fileUploaded(events) {
        this.isError = false;
        this.isUploading = true;
        this.config.csvJsonFile = events.target.files[0];
        if (this.config.csvJsonFile) {
            const filesize = parseFloat((Math.round((this.config.csvJsonFile.size / 1024 / 1024) * 100) / 100).toFixed(2));
            if (this.config.csvJsonFile && filesize > 500) {
                this.alertService.danger("File size shoud be less than 500mb!", `Current file size  ${filesize} mb`);
                this.config.csvJsonFile = null;
                this.isUploading = false;
                return;
            }

            const reader = new FileReader();
            let input = null;
            reader.addEventListener('load', () => {
                this.config.fileColumns = [];
                this.config.fragmentColumns = [];
                this.config.typeColumns = [];
                this.firstLine = '';
                input = reader.result; // event.target.result;
                if (this.config.csvJsonFile && this.config.csvJsonFile.type && this.config.csvJsonFile.type.toLowerCase().includes('csv')) {
                    this.firstLine = (input.toString().replace(/\r\n/g, '\n').split('\n'))[0];
                    this.config.type = 'CSV';
                    this.loadFieldColumns();
                } else {
                    this.config.type = 'JSON';
                    this.jsonData = this.isValidJson(input);
                    if (this.jsonData) {
                        this.processJSON();
                    } else {
                        this.isError = true;
                        events.srcElement.value = "";
                    }
                }

                this.isUploading = false;
            }, false);
            if (this.config.csvJsonFile) {
                reader.readAsText(this.config.csvJsonFile);
            } else {
                this.isUploading = false;
            }
        } else { this.isUploading = false; }

    }

    private loadFieldColumns() {
        this.config.fileColumns = [];
        this.config.typeColumns = [];
        this.config.fragmentColumns = []
        if (this.firstLine) {
            if (this.config && this.config.headerPresent) {
                const fieldList = this.firstLine.split(",");
                if (fieldList && fieldList.length > 0) {
                    fieldList.forEach((field, index) => {
                        this.config.fileColumns.push({
                            "displayName": field,
                            "value": 'column' + index
                        });
                    });
                }
            } else {
                const colList = this.firstLine.split(",");
                if (colList && colList.length > 0) {
                    colList.forEach((col, index) => {
                        this.config.fileColumns.push({
                            "displayName": 'column-' + index,
                            "value": 'column' + index
                        });
                    });
                }
            }
        }
        this.config.typeColumns = _.cloneDeep(this.config.fileColumns);
        this.config.fragmentColumns = _.cloneDeep(this.config.fileColumns);
        if (this.config.generationType === 'event') {
            this.config.eventTypeColumns = [];
            this.config.eventTypeColumns = _.cloneDeep(this.config.fileColumns);
        }
    }

    headerPresentChange() {
        if (this.config && this.config?.alternateConfigs?.operations[0]) {
            this.config.alternateConfigs.operations[0].type = '';
            this.config.alternateConfigs.operations[0].fragment = '';
            this.config.alternateConfigs.operations[0].series = [];
            this.config.alternateConfigs.operations[0].value = [];
            this.config.alternateConfigs.operations[0].unit = [];
            this.config.alternateConfigs.operations[0].dateTime = '';

        }
        this.loadFieldColumns();
    }

    generationTypeChange() {
        if (this.config.type === 'CSV') { this.loadFieldColumns() }
        else { this.processJSON(); }
    }
    changeIntervalType() {
        if (this.config.intervalType === 'fixed') {
            this.config.alternateConfigs.operations[0].dateTime = '';
        }
    }
    private processJSON() {
        if (this.jsonData && this.jsonData.constructor === Object) {
            this.processKeys(this.jsonData);
        } else if (this.jsonData && this.jsonData.length > 0) {
            this.processKeys(this.jsonData[0]);
        }
    }

    private processKeys(jsonObject: any) {
        this.config.fileColumns = [];
        this.config.typeColumns = [];
        this.config.fragmentColumns = []
        const keys = Object.keys(jsonObject);
        if (keys && keys.length > 0) {
            keys.forEach(key => {
                this.config.fileColumns.push(key);
                if (jsonObject[key].constructor === Object) {
                    this.config.fileColumns.push.apply(this.config.fileColumns, Object.keys(jsonObject[key]));
                }
            })
            this.config.typeColumns = _.cloneDeep(this.config.fileColumns);
            this.config.fragmentColumns = _.cloneDeep(this.config.fileColumns);
            if (this.config.generationType === 'event') {
                this.config.eventTypeColumns = [];
                this.config.eventTypeColumns = _.cloneDeep(this.config.fileColumns);
            }
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


    // Patch fix for server side simulators
    changeInterval(model: any) {
        model.alternateConfigs.operations[0].interval = model.interval;
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