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

import {
    Component, isDevMode,
    ViewChild,
} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {WizardComponent} from "../wizard/wizard.component";
import {contextPathFromURL} from "../utils/contextPathFromURL";
import {AlertService} from "@c8y/ngx-components";
import * as JSZip from "jszip";
import { ApplicationService, FetchClient } from '@c8y/client';
import * as delay from "delay";
import {UpdateableAlert} from "../utils/UpdateableAlert";

@Component({
    templateUrl: './install-widget-modal.component.html'
})
export class InstallWidgetModalComponent {
    busy: boolean = false;

    widgetFile: FileList;

    @ViewChild(WizardComponent) wizard: WizardComponent;

    constructor(public bsModalRef: BsModalRef, private alertService: AlertService, private appService: ApplicationService, private fetchClient: FetchClient) {}

    async upload() {
        // Steps:
        // 1. Upload the widget (if it doesn't already exist)
        // 2. Update the app-builder's cumulocity.json manifest to include the new widget

        const widgetUploadAlert = new UpdateableAlert(this.alertService);
        widgetUploadAlert.update("Uploading widget...")

        try {
            // Check if we're debugging or on localhost - updating the AppBuilder cumulocity.json won't work when debugging on localhost so don't do anything
            const currentHost = window.location.host.split(':')[0];
            if (isDevMode() || currentHost === 'localhost' || currentHost === '127.0.0.1') {
                widgetUploadAlert.update("Can't add a widget when running in Development Mode. Deploy the Application Builder first, or edit the package.json file.", "danger");
                return;
            }

            // Step 1: Upload the widget (if it doesn't already exist)
            const widgetFile = this.widgetFile.item(0);
            if (!widgetFile) {
                widgetUploadAlert.update("No widget file selected", "danger");
                console.error("No widget file selected");
                return;
            }

            this.busy = true;

            let widgetManifest;
            try {
                const widgetFileZip = await JSZip.loadAsync(widgetFile);
                widgetManifest = JSON.parse(await widgetFileZip.file('cumulocity.json').async("text"));
                if (widgetManifest.contextPath === undefined) {
                    throw Error("Widget has no context path");
                }
            } catch (e) {
                console.log("Not a valid widget", e);
                widgetUploadAlert.update("Not a valid widget", "danger");
                this.busy = false;
                return;
            }

            const appList = (await this.appService.list({pageSize: 2000})).data;

            if (appList.some(app => app.contextPath === widgetManifest.contextPath)) {
                widgetUploadAlert.update("Widget already deployed! Adding to AppBuilder...\n You can update a widget via the Apps Administration screen.");
            } else {
                // Upload the widget
                // Create the app
                const widgetApp = (await this.appService.create({
                    ...widgetManifest,
                    resourcesUrl: "/",
                    type: "HOSTED"
                } as any)).data;

                // Upload the binary
                const appBinary = (await this.appService.binary(widgetApp).upload(widgetFile)).data;

                // Update the app
                await this.appService.update({
                    id: widgetApp.id,
                    activeVersionId: appBinary.id.toString()
                });
                widgetUploadAlert.update("Widget deployed! Adding to AppBuilder...");
            }

            // Step 2: Update the app-builder's cumulocity.json manifest to include the new widget

            // find the application Builder's app
            // const appList = (await this.appService.list({pageSize: 2000})).data;
            const appBuilder = appList.find(app => app.contextPath === contextPathFromURL());
            if (!appBuilder) {
                throw Error('Could not find application builder');
            }


            const appBuilderManifest = await (await fetch(`cumulocity.json?${Date.now()}`)).json();

            // Update the app builder's cumulocity.json to include the new widget
            appBuilderManifest.widgetContextPaths = appBuilderManifest.widgetContextPaths || [];
            appBuilderManifest.widgetContextPaths.push(widgetManifest.contextPath);
            appBuilderManifest.widgetContextPaths = [...new Set(appBuilderManifest.widgetContextPaths)]

            const appBuilderManifestString = JSON.stringify(appBuilderManifest, null, 2);

            const buffer = new ArrayBuffer(appBuilderManifestString.length);
            const bufView = new Uint8Array(buffer);
            for (let i = 0; i < appBuilderManifestString.length; i++) {
                bufView[i] = appBuilderManifestString.charCodeAt(i);
            }

            await this.appService.binary(appBuilder).updateFiles([{
                path: "cumulocity.json",
                contents: buffer
            }]);

            widgetUploadAlert.update("Widget Added! Refreshing...", "success");

            // Give cumulocity a chance to load the file
            await delay(3000)

            location.reload();
        } catch(e) {
            widgetUploadAlert.update("Failed to add widget...\nSee browser console for more details");
            console.error(e);
            this.busy = false;
        }
    }
}
