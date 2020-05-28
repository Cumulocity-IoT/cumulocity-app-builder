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

import {Component, OnDestroy} from "@angular/core";
import {ApplicationService, InventoryService, IApplication} from "@c8y/client";
import {Observable, from, Subject, Subscription} from "rxjs";
import {debounceTime, filter, switchMap, tap} from "rxjs/operators";
import {AppBuilderNavigationService} from "../navigation/app-builder-navigation.service";
import {AlertService, AppStateService} from "@c8y/ngx-components";
import {BrandingService} from "../branding/branding.service";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {NewDashboardModalComponent} from "./new-dashboard-modal.component";
import {EditDashboardModalComponent} from "./edit-dashboard-modal.component";
import {AppIdService} from "../app-id.service";

export interface DashboardConfig {
    id: string,
    name: string,
    visibility?: '' | 'hidden' | 'no-nav',
    tabGroup: string,
    icon: string,
    deviceId?: string,
    groupTemplate: {
        groupId: string
    }
}

@Component({
    templateUrl: './dashboard-config.component.html',
    styleUrls: ['./dashboard-config.component.less']
})
export class DashboardConfigComponent implements OnDestroy {
    newAppName: string;
    newAppContextPath: string;
    newAppIcon: string;

    app: Observable<any>;

    delayedAppUpdateSubject = new Subject<any>();
    delayedAppUpdateSubscription: Subscription;

    bsModalRef: BsModalRef;

    constructor(
        private appIdService: AppIdService, private appService: ApplicationService, private appStateService: AppStateService,
        private brandingService: BrandingService, private inventoryService: InventoryService, private navigation: AppBuilderNavigationService,
        private modalService: BsModalService, private alertService: AlertService
    ) {
        this.app = this.appIdService.appIdDelayedUntilAfterLogin$.pipe(
            switchMap(appId => from(
                appService.detail(appId).then(res => res.data as any)
            )),
            tap((app: IApplication & {applicationBuilder: any}) => { // TODO: do this a nicer way....
                this.newAppName = app.name;
                this.newAppContextPath = app.contextPath;
                this.newAppIcon = app.applicationBuilder.icon;
            })
        );

        this.delayedAppUpdateSubscription = this.delayedAppUpdateSubject
            .pipe(debounceTime(500))
            .subscribe(async app => {
                await this.appService.update(app);
                this.navigation.refresh();
                // TODO?
                //this.tabs.refresh();
            });
    }

    async deleteDashboard(application, dashboards: DashboardConfig[], index: number) {
        dashboards.splice(index, 1);
        application.applicationBuilder.dashboards = [...dashboards];
        await this.appService.update({
            id: application.id,
            applicationBuilder: application.applicationBuilder
        } as any);

        this.navigation.refresh();
        // TODO?
        // this.tabs.refresh();
    }

    async reorderDashboards(app, newDashboardsOrder) {
        app.applicationBuilder.dashboards = newDashboardsOrder;

        this.delayedAppUpdateSubject.next({
            id: app.id,
            applicationBuilder: app.applicationBuilder
        });
    }

    async saveAppChanges(app) {
        // TODO
        throw new Error("Not implemented");
    }

    showCreateDashboardDialog(app) {
        this.bsModalRef = this.modalService.show(NewDashboardModalComponent, { class: 'c8y-wizard', initialState: { app } });
    }

    showEditDashboardDialog(app, dashboards: DashboardConfig[],index: number) {
        const dashboard = dashboards[index];
        this.bsModalRef = this.modalService.show(EditDashboardModalComponent, {
            class: 'c8y-wizard',
            initialState: {
                app,
                index,
                dashboardName: dashboard.name,
                dashboardVisibility: dashboard.visibility || '',
                dashboardIcon: dashboard.icon,
                deviceId: dashboard.deviceId,
                tabGroup: dashboard.tabGroup,
                ...(dashboard.groupTemplate ? {
                    dashboardType: 'group-template'
                } : {
                    dashboardType: 'standard'
                })
            }
        });
    }

    ngOnDestroy(): void {
        this.delayedAppUpdateSubscription.unsubscribe();
    }
}
