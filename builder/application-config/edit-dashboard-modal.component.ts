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

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {ApplicationService, InventoryService} from '@c8y/client';
import {WizardComponent} from "../../wizard/wizard.component";
import {AppBuilderNavigationService} from "../navigation/app-builder-navigation.service";
import {IApplicationBuilderApplication} from "../iapplication-builder-application";
import { AppDataService } from '../app-data.service';
import { Subject } from 'rxjs';

@Component({
    templateUrl: './edit-dashboard-modal.component.html'
})
export class EditDashboardModalComponent implements OnInit{
    busy = false;

    dashboardType: 'standard'|'group-template' = 'standard';
    dashboardName: string = '';
    dashboardIcon: string = 'th';
    deviceId: string = '';
    deviceName: string ='';
    tabGroup: string = '';
    roles: any = '';
    dashboardVisibility: '' | 'hidden' | 'no-nav' = '';
    globalRoles: any;
    dashboardID: string = '';

    index: number = 0;

    app: IApplicationBuilderApplication;
    public onSave: Subject<boolean>;

    @ViewChild(WizardComponent, {static: true}) wizard: WizardComponent;

    constructor(public bsModalRef: BsModalRef, private appService: ApplicationService, 
        private inventoryService: InventoryService, private navigation: AppBuilderNavigationService,
        private appDataService: AppDataService) {
            this.onSave = new Subject();
        }
    
    
    async ngOnInit() {
        if(this.deviceId) {
            const device = (await this.inventoryService.detail(this.deviceId)).data;
            if(device) { this.deviceName = device.name; }
        }
    }
    
    getSelectedDevice(device: any) {
        this.deviceId = device.id;
        this.deviceName = device.name;
        if(device && device.id === '') {
            this.deviceName = '';
        }
    }
    async save() {
        this.busy = true;
        let index = this.app.applicationBuilder.dashboards.findIndex((db: any) => db.id === this.dashboardID);
        const dashboard = this.app.applicationBuilder.dashboards[index];

        const dashboardManagedObject = (await this.inventoryService.detail(dashboard.id)).data;
        if (dashboardManagedObject.c8y_Dashboard.name === dashboard.name) {
            dashboardManagedObject.c8y_Dashboard.name = this.dashboardName;
            await this.inventoryService.update({
                id: dashboard.id,
                c8y_Dashboard: dashboardManagedObject.c8y_Dashboard
            });
        }

        dashboard.name = this.dashboardName;
        dashboard.visibility = this.dashboardVisibility;
        dashboard.tabGroup = this.tabGroup;
        dashboard.icon = this.dashboardIcon;
        dashboard.deviceId = this.deviceId;
        dashboard.roles =  this.roles;

        await this.appService.update({
            id: this.app.id,
            applicationBuilder: this.app.applicationBuilder
        } as any);
        this.appDataService.forceUpdate = true;
        this.onSave.next(true);
        this.bsModalRef.hide();
        this.navigation.refresh();
        // TODO?
        // this.tabs.refresh();
    }
}
