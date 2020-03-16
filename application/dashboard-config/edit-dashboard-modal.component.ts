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

import {Component, OnDestroy, ViewChild} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {ApplicationService, InventoryService} from '@c8y/client';
import {WizardComponent} from "../../wizard/wizard.component";
import {DashboardNavigation} from "../dashboard.navigation";
import {WELCOME_DASHBOARD_TEMPLATE} from "./dashboard-templates";
import {Subject} from "rxjs";
import {DashboardTabs} from "../dashboard.tabs";

@Component({
    templateUrl: './edit-dashboard-modal.component.html'
})
export class EditDashboardModalComponent {
    busy = false;

    dashboardType: 'standard'|'group-template' = 'standard';
    dashboardName: string = '';
    dashboardIcon: string = 'th';
    deviceId: string = '';
    tabGroup: string = '';
    dashboardVisibility: '' | 'hidden' | 'no-nav' = '';

    index: number = 0;

    app: any;

    @ViewChild(WizardComponent) wizard: WizardComponent;

    constructor(public bsModalRef: BsModalRef, private appService: ApplicationService, private inventoryService: InventoryService, private navigation: DashboardNavigation, private tabs: DashboardTabs) {}

    async save() {
        this.busy = true;

        const dashboard = this.app.applicationBuilder.dashboards[this.index];
        dashboard.name = this.dashboardName;
        dashboard.visibility = this.dashboardVisibility;
        dashboard.tabGroup = this.tabGroup;
        dashboard.icon = this.dashboardIcon;
        dashboard.deviceId = this.deviceId;

        await this.appService.update({
            id: this.app.id,
            applicationBuilder: this.app.applicationBuilder
        } as any);
        this.bsModalRef.hide();
        this.navigation.refresh();
        this.tabs.refresh();
    }
}
