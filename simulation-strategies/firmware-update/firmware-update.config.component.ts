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
import {SimulationStrategyConfigComponent} from "../../builder/simulator/simulation-strategy";

export interface FirmwareUpdateSimulationStrategyConfig {
    deviceId: string,
    isGroup?: boolean,
    firmwareVersions: {
        name: string,
        version: string,
        url: string
    }[],
    resetOn: 'restart' | 'never'
}

@Component({
    template: `
        <div class="form-group">
            <label><span>Firmware Versions</span></label>
            <table>
                <tr><th>Name</th><th>Version</th><th>URL</th></tr>
                <tr *ngFor="let firmware of config.firmwareVersions">
                    <td><input type="string" class="form-control" placeholder="e.g. Version 1 (required)" required [(ngModel)]="firmware.name"></td>
                    <td><input type="string" class="form-control" placeholder="e.g. 1.0.0 (required)" required [(ngModel)]="firmware.version"></td>
                    <td><input type="string" class="form-control" placeholder="e.g. https://firmware-repo.cumulocity.com" [(ngModel)]="firmware.url"></td>
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
            <select class="form-control" id="reset-on" name="reset-on" [(ngModel)]="config.resetOn">
                <option value="restart">On Simulator Restart</option>
                <option value="never">Never</option>
            </select>
        </div>
    `
})
export class FirmwareUpdateSimulationStrategyConfigComponent extends SimulationStrategyConfigComponent {
    config: FirmwareUpdateSimulationStrategyConfig;

    initializeConfig() {
        this.config.firmwareVersions = [
            {name: "Version 1", version: "1.0.0", url: "https://firmware-repo.cumulocity.com/v1.0.0"},
            {name: "Version 2", version: "2.0.0", url: "https://firmware-repo.cumulocity.com/v2.0.0"}
        ];
        this.config.resetOn = 'restart';
    }

    removeFirmware(firmware) {
        this.config.firmwareVersions = this.config.firmwareVersions.filter(fw => fw !== firmware);
    }

    addFirmware() {
        const versionNumber = this.config.firmwareVersions.length + 1;
        this.config.firmwareVersions.push({name: `Version ${versionNumber}`, version: `${versionNumber}.0.0`, url: `https://firmware-repo.cumulocity.com/v${versionNumber}.0.0`})
    }
}
