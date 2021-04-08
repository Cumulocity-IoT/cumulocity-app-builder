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

import {Component, OnInit} from "@angular/core";
import {
    UserService
} from "@c8y/client";
import {AppStateService} from "@c8y/ngx-components";
import { SettingsService } from './settings.service';

@Component({
    template: `
    <c8y-title>Custom Properties</c8y-title>
    <div class="col-xs-12 col-sm-8 col-md-8 card" >
        <form name="customPropertiesForm" #customPropertiesForm="ngForm">
        <div class="card-block" *ngIf="!isBusy">
            <div class="form-group">
                <label translate="" for="gainsightEnabled" >Gainsight Enabled</label>
                <input type="text" class="form-control" [disabled]="!userHasAdminRights || isGainsightParent " name="gainsightEnabled" id="gainsightEnabled" 
                placeholder="e.g. true/false (required)" required autofocus [(ngModel)]="customProperties.gainsightEnabled" >
            </div>
        </div>
        <div class="card-footer" style="text-align:center" *ngIf="userHasAdminRights">
            <button class="btn btn-primary" (click)="save(customProperties)" [disabled]="!customPropertiesForm.form.valid || !isFormValid()">Save</button>
        </div>
        </form>
    </div>
    `
})

// Custom property settings for Application Builder
export class CustomPropertiesComponent implements OnInit{

    userHasAdminRights: boolean;
    isBusy: boolean = false;
    isGainsightParent: boolean = false;
    customProperties = {
        gainsightEnabled: "false"
    }
    constructor( private appStateService: AppStateService,
        private userService: UserService, 
        private settingsService: SettingsService) {
        this.userHasAdminRights = userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN","ROLE_APPLICATION_MANAGEMENT_ADMIN"])
    }
                        

    async ngOnInit() {
        this.isBusy = true;
        this.customProperties = await this.settingsService.getCustomProperties();
        this.isGainsightParent = this.settingsService.isGaisigntEnabledFromParent();
        if(this.isGainsightParent) { this.customProperties.gainsightEnabled = 'true';}
        this.isBusy = false;
    }

    isFormValid() {
        return (this.customProperties.gainsightEnabled === 'true' || this.customProperties.gainsightEnabled === 'false');
    }

    save(customProperties) {
        this.settingsService.saveCustomProperties(customProperties);
    }
}
