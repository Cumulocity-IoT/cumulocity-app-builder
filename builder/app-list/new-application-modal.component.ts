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

import { Component, isDevMode, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ApplicationService, ApplicationAvailability, ApplicationType, FetchClient, InventoryService, IApplication } from '@c8y/client';
import { AlertService, AppStateService } from "@c8y/ngx-components";
import { UpdateableAlert } from "../utils/UpdateableAlert";
import { contextPathFromURL } from "../utils/contextPathFromURL";
import { Observable } from 'rxjs';
import { SettingsService } from './../settings/settings.service';
import { AppListService } from './app-list.service';

@Component({
    template: `
    <div class="modal-header text-center bg-primary">
        <div style="font-size: 62px;">
            <span c8yIcon="c8y-modules"></span>
        </div>
        <h4 class="text-uppercase" style="margin:0; letter-spacing: 0.15em;">Add application</h4>
    </div>
    <div class="modal-body c8y-wizard-form">
        <form name="newAppBuilderAppForm" #newAppBuilderAppForm="ngForm" class="c8y-wizard-form">
            <div class="form-group">
                <label for="name"><span>Name</span></label>
                <input type="text" class="form-control" id="name" name="name" placeholder="e.g. My First Application (required)" required [(ngModel)]="appName">
            </div>
            
            <div class="form-group">
                <label for="icon"><span>Icon</span></label>
                <icon-selector id="icon" name="icon" [(value)]="appIcon" appendTo=".modal-content"></icon-selector>
            </div>

            <div class="form-group">
                <label for="contextPath"><span>Context Path</span></label>
                <div class="input-group">
                    <div class="input-group-addon">/apps/</div>
                    <input type="text" class="form-control" id="contextPath" name="contextPath" [placeholder]="currentContextPath() + ' (optional, cannot be changed)'" [(ngModel)]="appPath">
                </div>
            </div>

            <div class="form-group">
                    <label for="appCloneName"><span>Clone Existing Application</span></label>
                    <input type="text" class="form-control" id="appCloneName" name="appCloneName"
                      placeholder="e.g. Type and select Application Name/Id (optional)" 
                      [(ngModel)]="existingAppName" [typeahead]="appNameList" autocomplete="off">
                      <span id="helpBlockCloneApp" class="help-block">Only application builder's applications can be cloned here.</span>
            </div>
            
            <!-- <div class="form-group">
                <label for="appImport"><span>Import Application</span></label>
                <input accept=".json" class="form-control" id="appImport" name="appImport" type="file" (change)="importFile($event.target.files)">
            </div> -->
        </form>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-default" (click)="bsModalRef.hide()">Cancel</button>
        <button type="button" class="btn btn-primary" [disabled]="!newAppBuilderAppForm.form.valid" (click)="createApplication()">Save</button>
    </div>
  `
})

export class NewApplicationModalComponent implements OnInit {
    appName: string = '';
    appPath: string = '';
    existingAppName: string = '';
    appIcon: string = 'bathtub';
    // applications: Observable<IApplication[]>;
    applications: IApplication[];
    allApplications: IApplication[];
    appList: any = [];
    appNameList: any = [];
    fileData: any;
    isImportApp: boolean;

    constructor(public bsModalRef: BsModalRef, private appService: ApplicationService, private appStateService: AppStateService,
        private fetchClient: FetchClient, private inventoryService: InventoryService, private alertService: AlertService,
        private settingsService: SettingsService, private appListService: AppListService) { }

    ngOnInit() {
        this.loadApplicationsForClone();
    }

    async createApplication() {
        let isCloneApp = false;
        let appBuilderObj;

        // app validation check 
        const appFound = this.allApplications.find(app => app.name.toLowerCase() === this.appName.toLowerCase() ||
            (this.appPath && this.appPath.length > 0 && (app.contextPath && app.contextPath?.toLowerCase() === this.appPath.toLowerCase())))
        if (appFound) {
            this.alertService.danger(" Application name or context path already exists!");
            return;
        }

        this.bsModalRef.hide();
        if (this.existingAppName) {
            const existingApp = this.existingAppName.split(' (');
            if (existingApp.length > 1) {
                const existingAppId = existingApp[1].replace(')', '');
                const appData = this.appList.filter(app => app.id === existingAppId);
                if (appData && appData.length > 0) {
                    appBuilderObj = appData[0].applicationBuilder;
                    if (appBuilderObj && appBuilderObj.icon) {
                        appBuilderObj.icon = this.appIcon;
                    }
                    appBuilderObj.version = __VERSION__;
                    isCloneApp = true;
                    const appDashboards = appBuilderObj.dashboards;
                    await Promise.all(appDashboards.map(async dashboard => {
                        await this.addClonedDashboard(appBuilderObj, dashboard.name, dashboard.id, dashboard.icon,
                            (dashboard.deviceId ? dashboard.deviceId : ''), dashboard.groupTemplate);
                    }));
                    if (appBuilderObj.simulators) {
                        let simulators = appBuilderObj.simulators;
                        simulators.forEach(simulator => {
                            simulator.id = Math.floor(Math.random() * 1000000);
                        });
                        appBuilderObj.simulators = simulators;
                    }
                }
            }
        }
        let defaultAppBuilderData: any;
        if (this.isImportApp) {
            defaultAppBuilderData = {
                applicationBuilder: {
                    version: this.fileData.version,
                    branding: this.fileData.branding,
                    dashboards: this.fileData.dashboards,
                    icon: this.fileData.icon,
                    simulators: this.fileData.simulators
                },
                icon: {
                    name: this.fileData.icon,
                    "class": `fa fa-${this.fileData.icon}`
                },
            };
        } else {
            defaultAppBuilderData = {
                applicationBuilder: isCloneApp ? appBuilderObj : {
                    version: __VERSION__,
                    branding: {
                        colors: {
                            primary: '#1776BF',
                            active: '#14629F',
                            text: '#0b385b',
                            textOnPrimary: 'white',
                            textOnActive: 'white',
                            hover: '#14629F',
                            headerBar: 'white',
                            toolBar: 'white',
                            tabBar: 'white'
                        }
                    },
                    dashboards: [],
                    icon: this.appIcon
                },
                icon: {
                    name: this.appIcon,
                    "class": `fa fa-${this.appIcon}`
                },
            };
        }

        let appId: any = '';

        // If the appPath option has been set then we copy the full AppBuilder into a new application
        if (this.appPath) {
            // Check if we're debugging or on localhost - copying the AppBuilder won't work when debugging on localhost
            // (it'll either copy the currently deployed version of the AppBuilder or fail...)
            if (isDevMode()) {
                this.alertService.danger("Can't create an application with a custom path when running in Development Mode. Deploy the Application Builder first, or create one without a custom path.");
                return;
            }
            const currentHost = window.location.host.split(':')[0];
            if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
                this.alertService.warning("Creating an application with a custom path may not work correct unless the Application Builder is deployed.");
            }

            const creationAlert = new UpdateableAlert(this.alertService);

            // find the application Builder's app
            let isClone = false;
            let appList = (await this.appService.list({ pageSize: 2000 })).data;
            let appBuilder: any;
            appBuilder = appList.find((app: any) => app.contextPath === contextPathFromURL() && (app.availability === 'PRIVATE' || 
            (app.owner && app.owner.tenant && this.settingsService.getTenantName() === app.owner.tenant.id)));
            let existingAppBuilderId: any = '';
            if (appBuilder) { existingAppBuilderId = appBuilder.id; }

            if (!appBuilder) {
                creationAlert.update('Searching Application Builder...');
                const appBuilderMarket = appList.find(app => app.contextPath === contextPathFromURL());
                if (!appBuilderMarket)
                    throw Error('Could not find application builder');
                else {
                    // Own Application not found... cloning subscribed application to access binary
                    existingAppBuilderId = appBuilderMarket.id;
                    appBuilder = await this.fetchClient.fetch(`application/applications/${appBuilderMarket.id}/clone`, { method: 'POST' }) as Response;
                    appList = (await this.appService.list({ pageSize: 2000 })).data;
                    appBuilder = appList.find((app: any) => app.contextPath && app.contextPath.indexOf('app-builder') !== -1 && app.availability === 'PRIVATE');
                    isClone = true;
                    if (!appBuilderMarket)
                        throw Error('Could not find application builder');
                }
            }
            const binaryId = appBuilder.activeVersionId;
            const binary = (await this.inventoryService.detail(binaryId)).data;

            creationAlert.update('Creating application...');

            try {
                // Download the binary
                const response = await this.fetchClient.fetch(`/inventory/binaries/${binaryId}`, { method: 'GET' }) as Response;
                if (!response.ok) {
                    throw Error('Could not get binary');
                }

                const reader = response.body.getReader();
                const contentLength = binary.length;
                let receivedLength = 0;
                const chunks = [];
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    chunks.push(value);
                    receivedLength += value.length;

                    const progress = receivedLength / contentLength * 100;
                    creationAlert.update(`Creating application...\nDownloading: ${progress.toFixed(0)}%`);
                }

                const blob = new Blob(chunks);

                // Create the app
                const app = (await this.appService.create({
                    ...appBuilder,
                    name: this.appName,
                    key: `application-builder-${this.appName}-app-key`,
                    contextPath: this.appPath,
                    manifest: {
                        ...appBuilder.manifest,
                        icon: defaultAppBuilderData.icon
                    },
                    owner: undefined,
                    activeVersionId: undefined,
                    applicationBuilder: undefined,
                    icon: undefined
                } as any)).data;

                // Upload the binary
                creationAlert.update(`Creating application...\nUploading...`);
                const fd = new FormData();
                fd.append('file', blob, 'app-builder.zip');
                const activeVersionId = (await (await this.fetchClient.fetch(`/application/applications/${app.id}/binaries`, {
                    method: 'POST',
                    body: fd,
                    headers: {
                        Accept: 'application/json'
                    }
                })).json()).id;

                // Update the app
                creationAlert.update(`Creating application...\nSaving...`);
                appId = app.id;
                await this.appService.update({
                    id: app.id,
                    activeVersionId,
                    ...defaultAppBuilderData
                } as any);

                // Update App Builder Custom Properties
                await this.updateAppBuilderConfiguration(existingAppBuilderId, appId);

                // deleting cloned app
                if (isClone) {
                    await this.fetchClient.fetch(`application/applications/${appBuilder.id}`, { method: 'DELETE' }) as Response;
                }
                creationAlert.update(`Application Created!`, "success");
                creationAlert.close(2000);
            } catch (e) {
                creationAlert.update('Failed to create application.\nCheck the browser console for more information', 'danger');
                throw e;
            }
        } else {
            const app = (await this.appService.create({
                name: this.appName,
                availability: ApplicationAvailability.PRIVATE,
                type: ApplicationType.EXTERNAL,
                key: `application-builder-${this.appName}-app-key`,
                externalUrl: `${window.location.pathname}#/application-builder`
            })).data;
            appId = app.id;
            await this.appService.update({
                id: app.id,
                externalUrl: `${window.location.pathname}#/application/${app.id}`,
                ...defaultAppBuilderData
            } as any);
        }
        // Track app creation if gainsight is configured
        if (window && window['aptrinsic']) {
            window['aptrinsic']('track', 'gp_appbuilder_createapp_clicked', {
                "appName": this.appName,
                "appId": appId,
                "tenantId": this.settingsService.getTenantName()
            });
        }
        // Refresh the applications list
        this.appStateService.currentUser.next(this.appStateService.currentUser.value);
        this.appListService.RefreshAppList();
    }

    private async updateAppBuilderConfiguration(appBuilderId: any, newAppId: any) {
        const AppBuilderConfigList = (await this.inventoryService.list({ pageSize: 50, query: `type eq AppBuilder-Configuration and appBuilderId eq '${appBuilderId}'` })).data;
        const appBuilderConfig = (AppBuilderConfigList.length > 0 ? AppBuilderConfigList[0] : null);
        await this.inventoryService.create({
            c8y_Global: {},
            type: "AppBuilder-Configuration",
            customProperties: ((appBuilderConfig && appBuilderConfig.customProperties) ? appBuilderConfig.customProperties : {}),
            appBuilderId: newAppId
        });
    }

    currentContextPath(): string {
        return contextPathFromURL();
    }

    loadApplicationsForClone() {
        this.appList = this.applications;
        if (this.appList && this.appList.length > 0) {
            this.appNameList = Array.from(new Set(this.appList.map(app => `${app.name} (${app.id})`)));
        }
        /*  this.applications.subscribe(apps => {
             this.appList = apps;
             if (this.appList && this.appList.length > 0) {
                 this.appNameList = Array.from(new Set(this.appList.map(app => `${app.name} (${app.id})`)));
             }
         }); */

    }

    async addClonedDashboard(appBuilderObj, name: string, dashboardId: string, icon: string, deviceId: string, isGroupTemplate: boolean = false) {
        const dashboardManagedObject = (await this.inventoryService.detail(dashboardId)).data;
        const template = dashboardManagedObject.c8y_Dashboard;
        await this.addTemplateDashboard(appBuilderObj, name, icon, template, deviceId, dashboardId, isGroupTemplate);
    }
    async addTemplateDashboard(appBuilderObj, name: string, icon: string, template: any, deviceId: string, existingDashboardId: string, isGroupTemplate: boolean = false) {
        const dashboardManagedObject = (await this.inventoryService.create({
            "c8y_Dashboard": {
                ...template,
                name,
                icon,
                global: true
            },
            ...(isGroupTemplate ? {
                applicationBuilder_groupTemplate: {
                    groupId: deviceId,
                    templateDeviceId: "NO_DEVICE_TEMPLATE_ID"
                }
            } : {})
        })).data;
        appBuilderObj.dashboards.forEach(dashboard => {
            if (dashboard.id === existingDashboardId) {
                dashboard.id = dashboardManagedObject.id
            }
        });
    }

    importFile(files: FileList) {
        const file = files[0];
        if (file) {
            this.isImportApp = true;
            this.appName = file.name.split('.')[0];
            new Response(files[0]).json().then(json => {
                this.fileData = json;
            }, err => {
                console.log("Error while reading file", err);
            });
        } else {
            this.isImportApp = false;
        }
    }
}
