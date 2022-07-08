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

import { Component, OnDestroy, OnInit } from "@angular/core";
import { ApplicationService, InventoryService, IApplication, IManagedObject } from "@c8y/client";
import { Observable, from, Subject, Subscription } from "rxjs";
import { debounceTime, filter, switchMap, tap } from "rxjs/operators";
import { AppBuilderNavigationService } from "../navigation/app-builder-navigation.service";
import { AlertService, AppStateService } from "@c8y/ngx-components";
import { BrandingService } from "../branding/branding.service";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { NewDashboardModalComponent } from "./new-dashboard-modal.component";
import { EditDashboardModalComponent } from "./edit-dashboard-modal.component";
import { AppIdService } from "../app-id.service";
import { UpdateableAlert } from "../utils/UpdateableAlert";
import { contextPathFromURL } from "../utils/contextPathFromURL";
import * as delay from "delay";
import { TemplateCatalogModalComponent } from "../template-catalog/template-catalog.component";
import { TemplateUpdateModalComponent } from "../template-catalog/template-update.component";
import { BinaryDescription, DeviceDescription } from "../template-catalog/template-catalog.model";
import { SettingsService } from './../../builder/settings/settings.service';
import { AlertMessageModalComponent } from "./../../builder/utils/alert-message-modal/alert-message-modal.component";
import { AccessRightsService } from "./../../builder/access-rights.service";


export interface DashboardConfig {
    id: string,
    name: string,
    visibility?: '' | 'hidden' | 'no-nav',
    tabGroup: string,
    icon: string,
    deviceId?: string,
    roles?: any,
    groupTemplate: {
        groupId: string
    },
    templateDashboard?: {
        id: string;
        name: string;
        devices?: Array<DeviceDescription>,
        binaries?: Array<BinaryDescription>,
        staticBinaries?: Array<BinaryDescription>
    }
}

@Component({
    templateUrl: './dashboard-config.component.html',
    styleUrls: ['./dashboard-config.component.less']
})
export class DashboardConfigComponent implements OnInit, OnDestroy {
    newAppName: string;
    newAppContextPath: string;
    newAppIcon: string;
    isDashboardCatalogEnabled: boolean = true;
    private globalRoles = [];

    app: Observable<any>;

    delayedAppUpdateSubject = new Subject<any>();
    delayedAppUpdateSubscription: Subscription;

    bsModalRef: BsModalRef;

    constructor(
        private appIdService: AppIdService, private appService: ApplicationService, private appStateService: AppStateService,
        private brandingService: BrandingService, private inventoryService: InventoryService, private navigation: AppBuilderNavigationService,
        private modalService: BsModalService, private alertService: AlertService, private settingsService: SettingsService,
        private accessRightsService: AccessRightsService
    ) {
        this.app = this.appIdService.appIdDelayedUntilAfterLogin$.pipe(
            switchMap(appId => from(
                appService.detail(appId).then(res => res.data as any)
            )),
            tap((app: IApplication & { applicationBuilder: any }) => { // TODO: do this a nicer way....
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

    async ngOnInit() {
        this.isDashboardCatalogEnabled = await this.settingsService.isDashboardCatalogEnabled();
        this.globalRoles = await this.accessRightsService.getAllGlobalRoles();  
    }

    private alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }
    async deleteDashboard(application, dashboards: DashboardConfig[], index: number) {
        const alertMessage = {
            title: 'Delete Dashboard',
            description: `You are about to delete this dashboard. This operation is irreversible. Do you want to proceed?`,
            type: 'danger',
            alertType: 'confirm', //info|confirm,
            confirmPrimary: true //confirm Button is primary
          }
          const installDemoDialogRef = this.alertModalDialog(alertMessage);
          await installDemoDialogRef.content.event.subscribe(async data => {
            if(data && data.isConfirm) {
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
          });
    }

    async reorderDashboards(app, newDashboardsOrder) {
        app.applicationBuilder.dashboards = newDashboardsOrder;

        this.delayedAppUpdateSubject.next({
            id: app.id,
            applicationBuilder: app.applicationBuilder
        });
    }

    async saveAppChanges(app) {
        const savingAlert = new UpdateableAlert(this.alertService);

        savingAlert.update('Saving application...');

        try {
            app.name = this.newAppName;
            app.applicationBuilder.icon = this.newAppIcon;
            app.icon = {
                name: this.newAppIcon,
                "class": `fa fa-${this.newAppIcon}`
            };

            const update: any = {
                id: app.id,
                name: app.name,
                key: `application-builder-${app.name}-app-key`,
                applicationBuilder: app.applicationBuilder,
                icon: app.icon
            };

            if (app.manifest) {
                app.manifest.icon = app.icon;
                update.manifest = app.manifest;
            }

            let contextPathUpdated = false;
            const currentAppContextPath = app.contextPath;
            if (app.contextPath && app.contextPath != this.newAppContextPath) {
                app.contextPath = this.newAppContextPath;
                update.contextPath = this.newAppContextPath;
                contextPathUpdated = true;
            }

            await this.appService.update(update);

            if (contextPathUpdated && contextPathFromURL() === currentAppContextPath) {
                savingAlert.update('Saving application...\nWaiting for redeploy...');
                // Pause while c8y server reloads the application
                await delay(5000);
                window.location = `/apps/${this.newAppContextPath}/${window.location.hash}` as any;
            }

            savingAlert.update('Application saved!', 'success');
            savingAlert.close(1500);
        } catch (e) {
            savingAlert.update('Unable to save!\nCheck browser console for details', 'danger');
            throw e;
        }

        // Refresh the application name/icon
        this.brandingService.updateStyleForApp(app);
        // Refresh the applications list
        this.appStateService.currentUser.next(this.appStateService.currentUser.value);
    }

    showCreateDashboardDialog(app) {
        this.bsModalRef = this.modalService.show(NewDashboardModalComponent, { class: 'c8y-wizard', initialState: { app,  globalRoles: this.globalRoles} });
    }

    showEditDashboardDialog(app, dashboards: DashboardConfig[], index: number) {
        // TODO differentiate betwenn template dashboard and normal dashboards

        const dashboard = dashboards[index];
        if (dashboard.templateDashboard) {
            this.showTemplateDashboardEditModalDialog(app, dashboard, index);
        } else {
            this.bsModalRef = this.modalService.show(EditDashboardModalComponent, {
                class: 'c8y-wizard',
                initialState: {
                    app,
                    globalRoles: this.globalRoles,
                    index,
                    dashboardName: dashboard.name,
                    dashboardVisibility: dashboard.visibility || '',
                    dashboardIcon: dashboard.icon,
                    deviceId: dashboard.deviceId,
                    tabGroup: dashboard.tabGroup,
                    roles: dashboard.roles,
                    ...(dashboard.groupTemplate ? {
                        dashboardType: 'group-template'
                    } : {
                            dashboardType: 'standard'
                        })
                }
            });
        }
    }

    showTemplateCatalogModalDialog(app): void {
        this.bsModalRef = this.modalService.show(TemplateCatalogModalComponent, { backdrop: 'static', class: 'modal-lg', initialState: { app } });
        this.bsModalRef.content.onSave.subscribe((isReloadRequired: boolean) => {
            if (isReloadRequired) {
                location.reload();
            }
        });
    }

    showTemplateDashboardEditModalDialog(app, dashboardConfig: DashboardConfig, index: number): void {
        this.bsModalRef = this.modalService.show(TemplateUpdateModalComponent, { backdrop: 'static', class: 'modal-lg', initialState: { app, dashboardConfig, index, globalRoles: this.globalRoles } });
    }

    ngOnDestroy(): void {
        this.delayedAppUpdateSubscription.unsubscribe();
    }
}
