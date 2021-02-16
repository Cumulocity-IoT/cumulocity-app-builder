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

import {Component, OnInit} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {InventoryService} from '@c8y/client';
import {AlertService} from "@c8y/ngx-components";
import {UpdateableAlert} from "../utils/UpdateableAlert";
import { IAnalyticsProvider, IAppBuilder } from 'builder/app-list/app-builder-interface';
import { AnalyticsProviderService } from './analytics-provider.service';

@Component({
    template: `
    <div class="modal-header text-center bg-primary">
        <div style="font-size: 62px;">
            <span c8yIcon="c8y-chart"></span>
        </div>
        <h4 class="text-uppercase" style="margin:0; letter-spacing: 0.15em;">Add Provider</h4>
    </div>
    <div class="modal-body c8y-wizard-form">
        <form name="newAnalyticsProviderForm" #newAnalyticsProviderForm="ngForm" class="c8y-wizard-form">
            <div class="form-group">
                <label for="provider"><span>Analytics Provider</span></label>
                <select name="provider" id="provider" required [(ngModel)]="analyticsProvider.providerName" placeholder="Select Analytics Provider (required)">
                    <option value="Gainsight PX">Gainsight PX</option>
                </select>
             </div>
            <div class="form-group">
                 <label for="accountId"><span>Account Id</span></label>
                 <input type="text" class="form-control" id="accountId" name="accountId" placeholder="e.g. app-builder-x.x.x (required) " required [(ngModel)]="analyticsProvider.providerAccountId">
            </div>
            <div class="form-group">
                <label for="accountName"><span>Account Name</span></label>
                <input type="text" class="form-control" id="accountName" name="accountName" placeholder="e.g. app-builder (required) " required  [(ngModel)]="analyticsProvider.providerAccountName">
            </div>
             <div class="form-group">
                <label for="providerURL"><span>URL</span></label>
                <input type="text" class="form-control" id="providerURL" name="providerURL" placeholder="e.g. https://web-sdk.aptrinsic.com/api/aptrinsic.js (required)" required [(ngModel)]="analyticsProvider.providerURL">
            </div>
            <div class="form-group">
                <label for="key"><span>Key</span></label>
                <input type="password" class="form-control" id="key" name="key" placeholder="e.g. XX-XXXX-XX-XX (required)" required [(ngModel)]="analyticsProvider.providerKey">
            </div>

            <div class="form-group">
                <label for="identity"><span>Identity</span></label>
                <input type="text" class="form-control" id="identity" name="identity" placeholder="e.g. mail@yourmail.com (required) " required [(ngModel)]="analyticsProvider.providerIdentity">
            </div>
            
        </form>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-default" (click)="bsModalRef.hide()">Cancel</button>
        <button type="button" class="btn btn-primary" [disabled]="!newAnalyticsProviderForm.form.valid" (click)="addAnalyticsProvider()">Save</button>
    </div>
  `
})

export class NewAnalyticsProviderModalComponent implements OnInit {
    appBuilderObject: IAppBuilder = {
        analyticsProvider: []
    };
    analyticsProvider: IAnalyticsProvider = {
        providerName: 'Gainsight PX',
        isActive: false
    };

    constructor(public bsModalRef: BsModalRef, private providerService: AnalyticsProviderService,
        private inventoryService: InventoryService, private alertService: AlertService) {}
   
    ngOnInit() {
        this.appBuilderObject.type = "AppBuilder-Configuration"
      }
   
    async addAnalyticsProvider() {
        this.bsModalRef.hide();
        const creationAlert = new UpdateableAlert(this.alertService);
        creationAlert.update('Adding new Provider...');
        this.analyticsProvider.id = Math.floor(Math.random() * 1000000);
        this.appBuilderObject.analyticsProvider.push(this.analyticsProvider);
        const AppBuilderConfig: IAppBuilder  = await this.providerService.getProviderList() as any;
        this.appBuilderObject.appBuilderId = await this.providerService.getAppBuilderId();
        if(AppBuilderConfig) {
            const analyticsProviderList = AppBuilderConfig.analyticsProvider || [];
            analyticsProviderList.push(this.analyticsProvider)
            await this.inventoryService.update({
                id: AppBuilderConfig.id,
                analyticsProvider: analyticsProviderList
            })
        } else  {
            await this.inventoryService.create(this.appBuilderObject);
        }
        creationAlert.update(`Proivder Added!`, "success");
        creationAlert.close();
        this.providerService.refresh();
    }

}
