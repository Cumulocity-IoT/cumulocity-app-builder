/*
* Copyright (c) 2024 Software AG, Darmstadt, Germany and/or its licensors
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
import { ApplicationService, ApplicationAvailability, ApplicationType, FetchClient, InventoryService, IApplication, IManagedObject, IManifest } from '@c8y/client';
import { AlertService, AppStateService, PluginsService } from "@c8y/ngx-components";
import { UpdateableAlert } from "../utils/UpdateableAlert";
import { contextPathFromURL } from "../utils/contextPathFromURL";
import { Observable } from 'rxjs';
import { SettingsService } from '../settings/settings.service';
import { AppListService } from './app-list.service';
import { cloneDeep, omit } from 'lodash-es';

@Component({
    template: `
    <div class="modal-header text-center bg-primary">
        <div style="font-size: 62px;">
            <span c8yIcon="output"></span>
        </div>
        <h4 class="text-uppercase" style="margin:0; letter-spacing: 0.15em;">Deploy application</h4>
    </div>
    <div class="modal-body c8y-wizard-form">
        <p class="bg-level-0 fit-w p-16 text-center text-medium text-bold separator-bottom">Clone and Deploy application using "Blueprint Forge" package </p>
        <form name="newBlueprintForgeAppForm" #newBlueprintForgeAppForm="ngForm" class="c8y-wizard-form">
            <div class="form-group">
                <label for="name"><span>Name</span></label>
                <input type="text" class="form-control" id="name" name="name" placeholder="e.g. My First Application (required)" required [(ngModel)]="appName" (ngModelChange)="validateAppName(newBlueprintForgeAppForm)">
            </div>
            
            <div class="form-group">
                <label for="icon"><span>Icon</span></label>
                <icon-selector id="icon" name="icon" [(value)]="appIcon" appendTo=".modal-content"></icon-selector>
            </div>

            <div class="form-group">
                <label for="contextPath"><span>Context Path</span></label>
                <div class="input-group">
                    <div class="input-group-addon">/apps/</div>
                    <input type="text" class="form-control" id="contextPath" name="contextPath" required placeholder="blueprint-forge-1 (cannot be changed)" [(ngModel)]="appPath">
                </div>
            </div>
            <div class="form-group">
                <div class="icon-flex help-block">
                    <i c8yIcon="info" class="text-info"></i>
                    <span>Only application builder's applications can be cloned here.</span>
                </div>
                <div class="icon-flex help-block">
                    <i c8yIcon="info" class="text-info"></i>
                    <span>You can safely delete the Application Builder app after deployment.</span>
                </div>
            </div>
            
        </form>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-default" (click)="bsModalRef.hide()">Cancel</button>
        <button type="button" class="btn btn-primary" [disabled]="!newBlueprintForgeAppForm.form.valid" (click)="deployApplication()">Clone & Deploy</button>
    </div>
  `
})

export class NewBlueprintForgeModalComponent implements OnInit {
    appName: string = '';
    appPath: string = '';
    appIcon: string = 'bathtub';
    application: IApplication;
    allApplications: IApplication[];
    appList: any = [];
    fileData: any;
    isImportApp: boolean;

    constructor(public bsModalRef: BsModalRef, private appService: ApplicationService, private appStateService: AppStateService,
        private fetchClient: FetchClient, private inventoryService: InventoryService, private alertService: AlertService,
        private settingsService: SettingsService, private appListService: AppListService,
        private pluginsService: PluginsService) { }

    ngOnInit() {
        this.appIcon = this.application?.applicationBuilder?.icon;
    }

    validateAppName(newBlueprintForgeAppForm) {
        const appFound = this.allApplications.find(app => app.name.toLowerCase() === this.appName.toLowerCase() ||
            (this.appPath && this.appPath.length > 0 && (app.contextPath && app.contextPath?.toLowerCase() === this.appPath.toLowerCase())))
        if (appFound) {
            newBlueprintForgeAppForm.form.setErrors({ 'invalid': true });
            this.alertService.danger(" Application name or context path already exists!");
            return;
        }
    }

    async deployApplication() {

        // app validation check 
        const appFound = this.allApplications.find(app => app.name.toLowerCase() === this.appName.toLowerCase() ||
            (this.appPath && this.appPath.length > 0 && (app.contextPath && app.contextPath?.toLowerCase() === this.appPath.toLowerCase())))
        if (appFound) {
            this.alertService.danger("Application name or context path already exists!");
            return;
        }
        /*  if (isDevMode()) {
             this.alertService.danger("This functionality is not supported in Development Mode. Please deploy the Application Builder and try again.");
             return;
         }
         const currentHost = window.location.host.split(':')[0];
         if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
             this.alertService.warning("This functionality is not supported on localhost. Please deploy Application Builder in your tenant and try again.");
             return;
         } */
        this.bsModalRef.hide();
        let blueprintFrogePackage = null;
        let packageCloneRequired = false;
        const compareContextPath = (this.application.contextPath ? this.application.contextPath : this.currentContextPath());
        const currentApp = this.allApplications.find(app => (app.contextPath === compareContextPath && (app.availability === ApplicationAvailability.PRIVATE || 
            (app.owner && app.owner.tenant && this.settingsService.getTenantName() === app.owner.tenant.id))));
        blueprintFrogePackage = this.allApplications.find(app => (app.contextPath === 'sag-ps-pkg-blueprint-forge' && (app.availability == ApplicationAvailability.PRIVATE ||
            (app.owner && app.owner.tenant && this.settingsService.getTenantName() === app.owner.tenant.id))));
        if (!blueprintFrogePackage) {
            const packageList = await this.pluginsService.listPackages();
            blueprintFrogePackage = packageList.find((pkg: IApplication) => pkg.contextPath === 'sag-ps-pkg-blueprint-forge');
            packageCloneRequired = true;
        }
        if (blueprintFrogePackage) {
            const { id, type, availability } = blueprintFrogePackage;
            const manifest = await this.appService.getAppManifest(blueprintFrogePackage);
            const newManifest = omit(manifest, ['name', 'contextPath', 'key']);
            const config: any = {
                id, type, availability,
                name: this.appName,
                applicationBuilder: this.application.applicationBuilder,
                key: `blueprint-forge-${this.appPath}-app-key`,
                contextPath: this.appPath
            }
            config.isSetup = false;
            config.manifest = newManifest;
            config.availability = ApplicationAvailability.PRIVATE;
            config.manifest.isPackage = false;
            config.manifest.source = blueprintFrogePackage.id;
            config.manifest.package = 'blueprint';
            config.manifest.icon = this.appIcon;
            config.applicationBuilder.icon= this.appIcon;
            config.icon =  {
                name: this.appIcon,
                "class": `fa fa-${this.appIcon}`
            };
            if(currentApp) {
                config.config = currentApp.config;
            }

            let clonedPackageData = null;
            let binaryId = null;
            if (packageCloneRequired) {
                clonedPackageData = (await this.appService.clone(blueprintFrogePackage)).data;
                binaryId = clonedPackageData.activeVersionId;
            } else {
                binaryId = blueprintFrogePackage.activeVersionId;
            }
            const { data: binaryData } = await this.inventoryService.detail(binaryId);

            const creationAlert = new UpdateableAlert(this.alertService);

            creationAlert.update('Deploying application...');

            try {
                // Download the binary
                creationAlert.update(`Deploying application...\nDownloading...`);
                const binary = await this.downloadBinary(clonedPackageData || blueprintFrogePackage, binaryId);

                // Preparing Zip
                const blob = new Blob([binary], { type: binaryData.contentType });

                // Create the app
                let app = (await this.appService.create(config)).data;

                // Upload the binary
                creationAlert.update(`Deploying application...\nUploading...`);
                const fd = new FormData();
                fd.append('file', blob, binaryData.name);
                const activeVersionId = (await (await this.fetchClient.fetch(`/application/applications/${app.id}/binaries`, {
                    method: 'POST',
                    body: fd,
                    headers: {
                        Accept: 'application/json'
                    }
                })).json()).id;

                // Update the app
                creationAlert.update(`Deploying application...\nSaving...`);
                app = (await this.appService.update({
                    id: app.id,
                    activeVersionId,
                })).data;

                const tempCurrentApp = cloneDeep(app);
                const removeProperties = ['id', 'owner', 'activeVersionId', 'self', 'type'];
                removeProperties.forEach(prop => delete tempCurrentApp[prop]);
                let manifest: Partial<IManifest> = (clonedPackageData ? clonedPackageData.manifest : blueprintFrogePackage.manifest);
                // update manifest

                tempCurrentApp.manifest = manifest;
                tempCurrentApp.manifest.isPackage = false;
                tempCurrentApp.manifest.source = (clonedPackageData ? clonedPackageData.id : blueprintFrogePackage.id);
                tempCurrentApp.manifest.icon = this.appIcon;

                await this.appService.binary(app.id)
                    .updateFiles([{ path: 'cumulocity.json', contents: JSON.stringify(tempCurrentApp) as any }]);

                // deleting cloned app
                if (packageCloneRequired) {
                    await this.fetchClient.fetch(`application/applications/${clonedPackageData.id}`, { method: 'DELETE' }) as Response;
                }
                creationAlert.update(`Application Created!`, "success");
                creationAlert.close(2000);
                // Track app creation if gainsight is configured
                if (window && window['aptrinsic']) {
                    window['aptrinsic']('track', 'gp_appbuilder_createapp_clicked', {
                        "appName": this.appName,
                        "appId": app.id,
                        "tenantId": this.settingsService.getTenantName()
                    });
                }
                // Refresh the applications list
                this.appStateService.currentUser.next(this.appStateService.currentUser.value);
                this.appListService.RefreshAppList();
            } catch (e) {
                creationAlert.update('Failed to deploy application.\nCheck the browser console for more information', 'danger');
                throw e;
            }
        } else {
            this.alertService.danger("The Blueprint Forge extension is not installed. Please install it and try again.!");
            return;
        }
    }

    currentContextPath(): string {
        return contextPathFromURL();
    }

    async downloadBinary(app: IApplication, binaryId: string | number): Promise<ArrayBuffer> {
        let binary;
        try {
            const res = await this.appService.binary(app).downloadArchive(binaryId);
            binary = await res.arrayBuffer();
        } catch (ex) {
            this.alertService.danger("Unable to download binary. Please try after sometime. If problem persists, please contact the administrator.");
            throw Error('Could not get binary');
        }
        return binary;
    }
}
