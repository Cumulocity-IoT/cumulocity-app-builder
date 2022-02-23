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

import { Component, DoCheck, OnChanges, SimpleChanges } from "@angular/core";
import { DtdlSimulationModel } from "builder/simulator/simulator-config";
import { SimulationStrategyConfigComponent } from "../../builder/simulator/simulation-strategy";
import * as _ from 'lodash';


@Component({
    template: `
        <div class="form-group">
            <label><span>Firmware Versions</span></label>
            <table>
                <tr><th>Name</th><th>Version</th><th>URL</th></tr>
                <tr *ngFor="let firmware of config.firmwareVersions">
                    <td><input type="string" class="form-control" placeholder="e.g. Version 1 (required)" required [(ngModel)]="firmware.name" (ngModelChange)="changeFirmware()"></td>
                    <td><input type="string" class="form-control" placeholder="e.g. 1.0.0 (required)" required [(ngModel)]="firmware.version" (ngModelChange)="changeFirmware()"></td>
                    <td><input type="string" class="form-control" placeholder="e.g. https://firmware-repo.cumulocity.com" [(ngModel)]="firmware.url" (ngModelChange)="changeFirmware()"></td>
                    <td><button *ngIf="config.firmwareVersions.length > 1" (click)="removeFirmware(firmware)">-</button></td>
                </tr>
                <tr>
                    <td colspan="3"></td>
                    <td><button (click)="addFirmware()">+</button></td>
                </tr>
            </table>
        </div>
        <div class="form-group">
            <label for="reset-on"><span>Reset Version</span></label>
            <select class="form-control" id="reset-on" name="reset-on" [(ngModel)]="config.resetOn" (ngModelChange)="changeResetVersion()">
                <option value="restart">On Simulator Restart</option>
                <option value="never">Never</option>
            </select>
        </div>
    `
})
export class FirmwareUpdateSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {


    config: DtdlSimulationModel;

    initializeConfig(existingConfig?: DtdlSimulationModel) {

        let c: DtdlSimulationModel = {
            deviceId: "",
            matchingValue: "default",
            firmwareVersions: [
                { name: "Version 1", version: "1.0.0", url: "https://firmware-repo.cumulocity.com/v1.0.0" },
                { name: "Version 2", version: "2.0.0", url: "https://firmware-repo.cumulocity.com/v2.0.0" }
            ],
            resetOn: 'restart',
            alternateConfigs: undefined
        };
        this.checkAlternateConfigs(c);

        if( existingConfig ) {
            c.resetOn = existingConfig.resetOn;
            c.firmwareVersions = [];
            existingConfig.firmwareVersions.forEach(fv => {
                c.firmwareVersions.push({
                    name: fv.name,
                    version: fv.version,
                    url: fv.url
                });
            });
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


    removeFirmware(firmware) {
        this.config.firmwareVersions = this.config.firmwareVersions.filter(fw => fw !== firmware);
        this.changeFirmware();
    }

    addFirmware() {
        const versionNumber = this.config.firmwareVersions.length + 1;
        this.config.firmwareVersions.push({ name: `Version ${versionNumber}`, version: `${versionNumber}.0.0`, url: `https://firmware-repo.cumulocity.com/v${versionNumber}.0.0` });
        this.changeFirmware();
    }

    changeFirmware() {
        this.config.alternateConfigs.operations[0].firmwareVersions = this.config.firmwareVersions;
    }

    changeResetVersion() {
        this.config.alternateConfigs.operations[0].resetOn = this.config.resetOn;
    }
   
}
