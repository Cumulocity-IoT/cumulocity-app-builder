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
    InventoryService,
    UserService
} from "@c8y/client";
import {AlertService, AppStateService} from "@c8y/ngx-components";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {NewAnalyticsProviderModalComponent} from "./new-analytics-provider-modal.component";
import {Router} from "@angular/router";
import { IAnalyticsProvider, IAppBuilder } from 'builder/app-list/app-builder-interface';
import { EditAnalyticsProviderModalComponent } from './edit-analytics-provider-modal.component';
import {UpdateableAlert} from "../utils/UpdateableAlert";
import { AnalyticsProviderService } from './analytics-provider.service';

@Component({
    templateUrl: './analytics-provider.component.html'
})
export class AnalyticsProviderComponent implements OnInit{

    userHasAdminRights: boolean;

    bsModalRef: BsModalRef;
    anlyticsProviderList: IAnalyticsProvider[] = [];
    AppBuilderConfig: IAppBuilder ; 
    alertServiceObj;
    appId:string;
    constructor( private appStateService: AppStateService, private providerService: AnalyticsProviderService,
        private modalService: BsModalService, private userService: UserService, private inventoryService: InventoryService,
        private alertService: AlertService) {
        this.providerService.refreshProviderList.subscribe(() => {
            this.getProviderList();
        });
        this.userHasAdminRights = userService.hasRole(appStateService.currentUser.value, "ROLE_APPLICATION_MANAGEMENT_ADMIN")
    }

    ngOnInit() {
        this.alertServiceObj = new UpdateableAlert(this.alertService);
        this.getProviderList()
    }

    private async getProviderList() {
            this.AppBuilderConfig = await this.providerService.getProviderList() as any;
            if(this.AppBuilderConfig) {
            this.appId = this.AppBuilderConfig.appBuilderId;
            this.anlyticsProviderList = this.AppBuilderConfig.analyticsProvider;
            this.anlyticsProviderList.sort((a, b) => a.providerAccountName > b.providerAccountName ? 1 : -1);
        }

    }

    createProvider() {
        this.bsModalRef = this.modalService.show(NewAnalyticsProviderModalComponent, { class: 'c8y-wizard' });
    }

    async provideActiveChanged(analyticsProvider : IAnalyticsProvider, active: boolean) {
        analyticsProvider.isActive = active;
        const analyticsProviderList = this.AppBuilderConfig.analyticsProvider.filter( provider => provider.id !== analyticsProvider.id);
        if(analyticsProvider.isActive) {
            analyticsProviderList.forEach((providerItem) => {
                providerItem.isActive = false;
            });
        }
        analyticsProviderList.push(analyticsProvider);
        await this.inventoryService.update({
            id: this.AppBuilderConfig.id,
            analyticsProvider: analyticsProviderList
        });
        this.alertServiceObj.update(`Provider Updated! Refreshing...`, "success");
        await this.alertServiceObj.close(3000);
        location.reload();
    }

    editProvider(analyticsProvider: any) {
        let providerObj = {};
        providerObj = Object.assign(providerObj, analyticsProvider);
        this.bsModalRef = this.modalService.show(EditAnalyticsProviderModalComponent, { class: 'c8y-wizard', initialState: { analyticsProvider : providerObj} })

    }
    async deleteProvider(analyticsProvider: any) {
       
        const analyticsProviderList = this.AppBuilderConfig.analyticsProvider.filter( provider => provider.id !== analyticsProvider.id);
        await this.inventoryService.update({
            id: this.AppBuilderConfig.id,
            analyticsProvider: analyticsProviderList
        });
        this.alertServiceObj.update(`Proivder Deleted!`, "success");
        this.alertServiceObj.close();
        this.providerService.refresh();
    }

}
