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

import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {ApplicationService, ApplicationAvailability, ApplicationType, FetchClient, InventoryService} from '@c8y/client';
import {AlertService, AppStateService} from "@c8y/ngx-components";
import {UpdateableAlert} from "../utils/UpdateableAlert";
import {contextPathFromURL} from "../utils/contextPathFromURL";

@Component({
    template: `
    <div class="modal-header text-center bg-primary">
        <div style="font-size: 62px;">
            <span c8yIcon="c8y-modules"></span>
        </div>
        <h4 class="text-uppercase" style="margin:0; letter-spacing: 0.15em;">Add application</h4>
    </div>
    <div class="modal-body c8y-wizard-form">
        <form name="newAppBuilderAppForm" class="c8y-wizard-form">
            <div class="form-group">
                <label for="name"><span>Name</span></label>
                <input type="text" class="form-control" id="name" name="name" placeholder="e.g. My First Application (required)" required [(ngModel)]="appName">
            </div>
            
            <div class="form-group">
                <label for="icon"><span>Icon</span></label>
                <icon-selector id="icon" name="icon" [(value)]="appIcon"></icon-selector>
            </div>

            <div class="form-group">
                <label for="name"><span>Context Path</span></label>
                <div class="input-group">
                    <div class="input-group-addon">/apps/</div>
                    <input type="text" class="form-control" id="name" name="name" [placeholder]="currentContextPath() + ' (optional, cannot be changed)'" [(ngModel)]="appPath">
                </div>
            </div>
        </form>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-default" (click)="bsModalRef.hide()">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="createApplication()">Save</button>
    </div>
  `
})

export class NewApplicationModalComponent {
    appName: string = '';
    appPath: string = '';
    appIcon: string = 'bathtub';

    constructor(public bsModalRef: BsModalRef, private appService: ApplicationService, private appStateService: AppStateService, private fetchClient: FetchClient, private inventoryService: InventoryService, private alertService: AlertService) {}

    async createApplication() {
        this.bsModalRef.hide();

        const defaultAppBuilderData = {
            applicationBuilder: {
                version: __VERSION__,
                branding: {
                    colors: {
                        primary: '#1776BF',
                        active: '#14629F',
                        text: '#333333',
                        textOnPrimary: 'white',
                        textOnActive: 'white'
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

        if (this.appPath) {
            // find the application Builder's app
            const appList = (await this.appService.list({pageSize: 2000})).data;
            const appBuilder = appList.find(app => app.contextPath === contextPathFromURL());
            if (!appBuilder) {
                throw Error('Could not find application builder');
            }
            const binaryId = appBuilder.activeVersionId;
            const binary = (await this.inventoryService.detail(binaryId)).data;

            const creationAlert = new UpdateableAlert(this.alertService);

            creationAlert.update('Creating application...');

                try {
                    // Download the binary
                    const response = await this.fetchClient.fetch(`/inventory/binaries/${binaryId}`, {method: 'GET'}) as Response;
                    if (!response.ok) {
                        throw Error('Could not get binary');
                    }

                    const reader = response.body.getReader();
                    const contentLength = binary.length;

                    let receivedLength = 0;
                    const chunks = [];
                    while (true) {
                        const {done, value} = await reader.read();

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
                    await this.appService.update({
                        id: app.id,
                        activeVersionId,
                        ...defaultAppBuilderData
                    } as any);
                    creationAlert.update(`Application Created!`, "success");
                    creationAlert.close(2000);
                } catch(e) {
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
            await this.appService.update({
                id: app.id,
                externalUrl: `${window.location.pathname}#/application/${app.id}`,
                ...defaultAppBuilderData
            } as any);
        }

        // Refresh the applications list
        this.appStateService.currentUser.next(this.appStateService.currentUser.value);
    }

    currentContextPath(): string {
        return contextPathFromURL();
    }
}
