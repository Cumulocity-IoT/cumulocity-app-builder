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

import {Component, OnDestroy, OnInit} from "@angular/core";
import {
    UserService
} from "@c8y/client";
import {AppStateService} from "@c8y/ngx-components";
import { Subscription } from 'rxjs';
import { SettingsService } from './settings.service';

@Component({
    template: `
    <c8y-title>Custom Properties</c8y-title>
    <div class="col-xs-12 col-sm-8 col-md-8 card" >
        <form name="customPropertiesForm" #customPropertiesForm="ngForm">
        <div class="card-block" *ngIf="!isBusy">
            <div class="form-group">
                <label translate="" for="gainsightEnabled" >Gainsight</label>
                <button class="btn btn-default" id="gainsightEnabled" name="gainsightEnabled" [(ngModel)]="gainsightEnabled" 
                        (ngModelChange)="changeGainsightStatus()" [disabled]="!userHasAdminRights || isGainsightParent" 
                        [class.disabled]="!userHasAdminRights || isGainsightParent" btnCheckbox tabindex="0">{{gainsightEnabled? 'Enabled' : 'Disabled' }}</button>
            </div>
            <div class="form-group" *ngIf="false">
                <label translate="" for="dashboardCataglogEnabled" >Dashboard Catalog Enabled</label>
                <input type="text" class="form-control" [disabled]="!userHasAdminRights " name="dashboardCataglogEnabled" id="dashboardCataglogEnabled" 
                placeholder="e.g. true/false (required)" required autofocus [(ngModel)]="customProperties.dashboardCataglogEnabled" >
            </div>
        </div>
        <div *ngIf="isBusy" class="col-xs-12 col-sm-12 col-md-12" style="padding-bottom:50px;padding-top:20px">
            <rectangle-spinner  style="position: relative; left: 47%;">
            </rectangle-spinner>
        </div>
        <div class="card-footer" style="text-align:center" *ngIf="userHasAdminRights">
            <button class="btn btn-primary" (click)="save(customProperties)" [disabled]="!customPropertiesForm.form.valid || !isFormValid()">Save</button>
        </div>
        </form>
    </div>
    `
})

// Custom property settings for Application Builder
export class CustomPropertiesComponent implements OnInit, OnDestroy{

    userHasAdminRights: boolean;
    isBusy: boolean = false;
    isGainsightParent: boolean = false;
    gainsightEnabled = false;
    customProperties = {
        gainsightEnabled: "false",
        dashboardCataglogEnabled: "false"
    }
    delayedTenantSubscription: Subscription;
    constructor( private appStateService: AppStateService,
        private userService: UserService, 
        private settingsService: SettingsService) {
        this.userHasAdminRights = userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN","ROLE_APPLICATION_MANAGEMENT_ADMIN"]);
        this.delayedTenantSubscription = this.settingsService.delayedTenantUpdateSubject.subscribe ((tenant) => {
            this.isGainsightParent = this.settingsService.isGaisigntEnabledFromParent();
            if(this.isGainsightParent) { this.customProperties.gainsightEnabled = 'true';}
        });
    }
                        

    async ngOnInit() {
        this.isBusy = true;
        this.customProperties = await this.settingsService.getCustomProperties();
        this.isGainsightParent = this.settingsService.isGaisigntEnabledFromParent();
        if(this.isGainsightParent) { this.customProperties.gainsightEnabled = 'true';}
        if(this.customProperties && !this.customProperties.dashboardCataglogEnabled) {
            this.customProperties.dashboardCataglogEnabled = 'false';
        }
        if(this.customProperties.gainsightEnabled === 'true') { this.gainsightEnabled = true;}
        this.isBusy = false;
    }

    changeGainsightStatus() {
        console.log('gainsight toggle', this.gainsightEnabled);
        if(this.gainsightEnabled) { this.customProperties.gainsightEnabled = 'true';}
        else { this.customProperties.gainsightEnabled = 'false'; }

    }
    isFormValid() {
        return ((this.customProperties.gainsightEnabled === 'true' || this.customProperties.gainsightEnabled === 'false') && 
        (this.customProperties.dashboardCataglogEnabled === 'true' || this.customProperties.dashboardCataglogEnabled === 'false'));
    }

    save(customProperties) {
        this.settingsService.saveCustomProperties(customProperties);
    }

    ngOnDestroy() {
        this.delayedTenantSubscription.unsubscribe();
    }
}
