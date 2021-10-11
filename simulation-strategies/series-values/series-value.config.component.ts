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
            <label for="value"><span>Value</span></label>
            <input type="text" class="form-control" id="value" name="value" placeholder="e.g. 15,20,30 (required)" required [(ngModel)]="config.value">
        </div>


        
        <div class="form-group">
            <div> {{config.operations | json}}
            <accordion  [isAnimated]="true" [closeOthers]="true">
                <accordion-group panelClass="dtdl-simulator-measurement-panel"    #dtdlGroup>
                    <button class="btn btn-link btn-block clearfix" accordion-heading type="button">
                        <div class="pull-left float-left">test</div>
                        <span class="float-right pull-right"><i *ngIf="dtdlGroup.isOpen" class="fa fa-caret-up"></i>
                        <i *ngIf="!dtdlGroup.isOpen" class="fa fa-caret-down"></i></span>
                    </button>
                </accordion-group>
            </accordion>
        </div>






        <ng-template *ngIf="config.operations.length > 1">
            <div class="form-group">
                <label for="opSource"><span>Operation Source</span></label>
                <input type="text" class="form-control" id="opSource" name="opSource" placeholder="e.g. device Id" required autofocus [(ngModel)]="config.operations[1].deviceId">
            </div>
            <div *ngFor="let op of config.operations">
                <div class="form-group">
                    <label for="opValue"><span>Value</span></label>
                    <input type="text" class="form-control" id="opValue" name="opValue" placeholder="e.g. 15,20,30 (required)" required [(ngModel)]="op.config.value">
                </div>
            </div>
        </ng-template>

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
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class SeriesValueSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {

    getNamedConfig(label: string): SeriesValueSimulationStrategyConfig | undefined {
        let c: SeriesValueSimulationStrategyConfig = this.getConfigAsAny(label);
        return c;
    }

    config: SeriesValueSimulationStrategyConfig;

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
            matchingValue: ""
        };

        //New objects can duplicate the default so it can be restored
        //we will create the config entries if old simulators are edited
        //duplication is to avoid changing old code.
        this.config = _.cloneDeep(c);
        this.config.operations.push(opDef);
    }
}
