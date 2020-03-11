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
import {DashboardNavigation} from "../dashboard.navigation";
import {WELCOME_DASHBOARD_TEMPLATE} from "./dashboard-templates";

@Component({
    templateUrl: './new-dashboard-modal.component.html'
})
export class NewDashboardModalComponent {
    busy = false;

    creationMode: 'blank' | 'template' | 'existing' | 'clone' | 'group-template' = 'blank';

    dashboardId: string = '12598412';
    dashboardName: string = '';
    dashboardIcon: string = 'th';
    deviceId: string = '';

    dashboardTemplate: 'welcome' = 'welcome';

    app: any;

    @ViewChild(WizardComponent) wizard: WizardComponent;

    constructor(public bsModalRef: BsModalRef, private appService: ApplicationService, private inventoryService: InventoryService, private navigation: DashboardNavigation) {}

    showId() {
        switch(this.creationMode) {
            case "existing":
            case "clone":
                return true;
            default: return false;
        }
    }

    async createDashboard() {
        this.busy = true;
        switch(this.creationMode) {
            case "blank": {
                await this.addNewDashboard(this.app, this.dashboardName, this.dashboardIcon);
                break;
            }
            case "template": {
                await this.addTemplateDashboardByTemplateName(this.app, this.dashboardName, this.dashboardIcon, this.dashboardTemplate);
                break;
            }
            case "existing": {
                await this.addExistingDashboard(this.app, this.dashboardName, this.dashboardId, this.dashboardIcon);
                break;
            }
            case "clone": {
                await this.addClonedDashboard(this.app, this.dashboardName, this.dashboardId, this.dashboardIcon);
                break;
            }
            case "group-template": {
                await this.addNewDashboard(this.app, this.dashboardName, this.dashboardIcon, true);
                break;
            }
            default: {
                throw Error(`Unknown dashboard creation mode: ${this.creationMode}`);
            }
        }
        this.bsModalRef.hide()
    }

    async addClonedDashboard(application, name: string, dashboardId: string, icon: string) {
        const dashboardManagedObject = (await this.inventoryService.detail(dashboardId)).data;

        const template = dashboardManagedObject.c8y_Dashboard;

        await this.addTemplateDashboard(application, name, icon, template);
    }

    async addExistingDashboard(application, name: string, dashboardId: string, icon: string) {
        application.applicationBuilder.dashboards = [
            ...application.applicationBuilder.dashboards || [],
            {
                id: dashboardId,
                name,
                icon,
                ...(this.deviceId != '' ? { deviceId: this.deviceId } : {})
            }
        ];
        await this.appService.update({
            id: application.id,
            applicationBuilder: application.applicationBuilder
        } as any);

        this.navigation.refresh();
    }

    async addNewDashboard(application, name: string, icon: string, isGroupTemplate: boolean = false) {
        await this.addTemplateDashboard(application, name, icon, {
            children: {},
            name,
            icon,
            global: true,
            priority: 10000
        }, isGroupTemplate);
    }

    async addTemplateDashboardByTemplateName(application, name: string, icon: string, templateName: 'welcome') {
        const template = {
            welcome: WELCOME_DASHBOARD_TEMPLATE
        }[templateName];

        await this.addTemplateDashboard(application, name, icon, template);
    }

    async addTemplateDashboard(application, name: string, icon: string, template: any, isGroupTemplate: boolean = false) {
        const dashboardManagedObject = (await this.inventoryService.create({
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
                icon,
                ...(this.deviceId != '' ? { deviceId: this.deviceId } : {}),
                ...(isGroupTemplate ? { groupTemplate: true } : {})
            }
        ];
        await this.appService.update({
            id: application.id,
            applicationBuilder: application.applicationBuilder
        } as any);

        this.navigation.refresh();
    }
}
