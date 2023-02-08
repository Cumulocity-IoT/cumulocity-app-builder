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

import {Component, ViewChild} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {ApplicationService, InventoryService} from '@c8y/client';
import {WizardComponent} from "../../wizard/wizard.component";
import {WELCOME_DASHBOARD_TEMPLATE} from "./dashboard-templates";
import {HELP_SUPPORT_DASHBOARD_TEMPLATE} from "./help-support-templates";
import {AppBuilderNavigationService} from "../navigation/app-builder-navigation.service";
import { AppDataService } from '../app-data.service';
import { Subject } from 'rxjs';

@Component({
    templateUrl: './new-dashboard-modal.component.html'
})
export class NewDashboardModalComponent {
    busy = false;

    creationMode: 'blank' | 'template' | 'existing' | 'clone' | 'group-template' = 'blank';

    dashboardId: string = '12598412';
    dashboardName: string = '';
    dashboardPath: string = null;
    dashboardIcon: string = 'th';
    deviceId: string = '';
    deviceName: string = '';
    tabGroup: string = '';
    dashboardVisibility: '' | 'hidden' | 'no-nav' = '';
    selectedGlobalRoles: any;
    dashboardTemplate: 'welcome' = 'welcome';

    app: any;
    globalRoles: any;
    public onSave: Subject<boolean>;

    @ViewChild(WizardComponent, {static: true}) wizard: WizardComponent;

    constructor(public bsModalRef: BsModalRef, private appService: ApplicationService, 
        private inventoryService: InventoryService, private navigation: AppBuilderNavigationService,
        private appDataService: AppDataService) {
            this.onSave = new Subject();
        }
    

    showId() {
        switch(this.creationMode) {
            case "existing":
            case "clone":
                return true;
            default: return false;
        }
    }
    getSelectedDevice(device: any) {
        this.deviceId = device.id;
        this.deviceName = device.name;
        if(device && device.id === '') {
            this.deviceName = '';
        }
    }
    async createDashboard() {
        this.busy = true;
        switch(this.creationMode) {
            case "blank": {
                await this.addNewDashboard(this.app, this.dashboardName, this.dashboardVisibility, this.dashboardIcon, this.tabGroup, this.selectedGlobalRoles);
                break;
            }
            case "template": {
                await this.addTemplateDashboardByTemplateName(this.app, this.dashboardName, this.dashboardVisibility, this.dashboardIcon, this.dashboardTemplate, this.tabGroup, this.selectedGlobalRoles);
                break;
            }
            case "existing": {
                await this.addExistingDashboard(this.app, this.dashboardName, this.dashboardVisibility, this.dashboardId, this.dashboardIcon, this.tabGroup, this.selectedGlobalRoles);
                break;
            }
            case "clone": {
                await this.addClonedDashboard(this.app, this.dashboardName, this.dashboardVisibility, this.dashboardId, this.dashboardIcon, this.tabGroup, this.selectedGlobalRoles);
                break;
            }
            case "group-template": {
                await this.addNewDashboard(this.app, this.dashboardName, this.dashboardVisibility, this.dashboardIcon, this.tabGroup, this.selectedGlobalRoles, true);
                break;
            }
            default: {
                throw Error(`Unknown dashboard creation mode: ${this.creationMode}`);
            }
        }
        this.onSave.next(true);
        this.bsModalRef.hide();
    }

    async addClonedDashboard(application, name: string, visibility: '' | 'hidden' | 'no-nav', dashboardId: string, icon: string, tabGroup: string, selectedGlobalRoles: any) {
        const dashboardManagedObject = (await this.inventoryService.detail(dashboardId)).data;

        const template = dashboardManagedObject.c8y_Dashboard;

        await this.addTemplateDashboard(application, name, visibility, icon, template, tabGroup, selectedGlobalRoles);
    }

    async addExistingDashboard(application, name: string, visibility: '' | 'hidden' | 'no-nav', dashboardId: string, icon: string, tabGroup: string, selectedGlobalRoles: any) {
        application.applicationBuilder.dashboards = [
            ...application.applicationBuilder.dashboards || [],
            {
                id: dashboardId,
                name,
                visibility,
                icon,
                ...(this.deviceId != '' ? { deviceId: this.deviceId } : {}),
                tabGroup,
                roles: selectedGlobalRoles
            }
        ];
        await this.appService.update({
            id: application.id,
            applicationBuilder: application.applicationBuilder
        } as any);

        this.navigation.refresh();
        // TODO?
        // this.tabs.refresh();
    }

    async addNewDashboard(application, name: string, visibility: '' | 'hidden' | 'no-nav', icon: string, tabGroup: string, selectedGlobalRoles: any,isGroupTemplate: boolean = false) {
        await this.addTemplateDashboard(application, name, visibility, icon, {
            children: {},
            name,
            icon,
            global: true,
            priority: 10000
        }, tabGroup, selectedGlobalRoles, isGroupTemplate);
    }

    async addTemplateDashboardByTemplateName(application, name: string, visibility: '' | 'hidden' | 'no-nav', icon: string, templateName: 'welcome', tabGroup: string, selectedGlobalRoles: any) {
        const template = {
            welcome: WELCOME_DASHBOARD_TEMPLATE,
            helpsupport: HELP_SUPPORT_DASHBOARD_TEMPLATE
        }[templateName];
        await this.addTemplateDashboard(application, name, visibility, icon, template, tabGroup, selectedGlobalRoles);
    }

    async addTemplateDashboard(application, dbName: string, visibility: '' | 'hidden' | 'no-nav', icon: string, template: any, tabGroup: string, selectedGlobalRoles: any, isGroupTemplate: boolean = false) {
        const name = (this.dashboardPath ? `${this.dashboardPath}/${dbName}` : dbName );
        const dashboardManagedObject = (await this.inventoryService.create({
            c8y_Global: {},
            "c8y_Dashboard!name!app-builder-db": {},
            "c8y_Dashboard": {
                ...template,
                name,
                icon,
                global: true
            },
            ...(isGroupTemplate ? {
                applicationBuilder_groupTemplate: {
                    groupId: this.deviceId,
                    templateDeviceId: "NO_DEVICE_TEMPLATE_ID"
                }
            } : {})
        })).data;
        application.applicationBuilder.dashboards = [
            ...application.applicationBuilder.dashboards || [],
            {
                id: dashboardManagedObject.id,
                name,
                visibility,
                icon,
                tabGroup,
                roles: selectedGlobalRoles,
                ...(this.deviceId != '' ? { deviceId: this.deviceId } : {}),
                ...(isGroupTemplate ? { groupTemplate: true } : {})
            }
        ];
        await this.appService.update({
            id: application.id,
            applicationBuilder: application.applicationBuilder
        } as any);
        this.appDataService.forceUpdate = true;

        this.navigation.refresh();
        // TODO?
        // this.tabs.refresh();
    }
}
