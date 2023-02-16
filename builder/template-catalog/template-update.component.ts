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

import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { DashboardConfig } from "../application-config/dashboard-config.component";
import { DeviceSelectorModalComponent } from "../utils/device-selector-modal/device-selector.component";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { IManagedObject } from '@c8y/client';
import { TemplateDetails } from "./template-catalog.model";
import { TemplateCatalogService } from "./template-catalog.service";
import { ProgressIndicatorModalComponent } from "../utils/progress-indicator-modal/progress-indicator-modal.component";
import { catchError } from "rxjs/operators";

@Component({
    selector: 'template-update-component',
    templateUrl: './template-update.component.html',
    styleUrls: ['template-catalog.less']
})
export class TemplateUpdateModalComponent implements OnInit {

    app: any;

    dashboardConfig: DashboardConfig;

    index: number;

    templateDetails: TemplateDetails;

    globalRoles: any;

    isLoadingIndicatorDisplayed = false;

    private deviceSelectorModalRef: BsModalRef;

    private progressModal: BsModalRef;

    constructor(private modalService: BsModalService, private modalRef: BsModalRef, private catalogService: TemplateCatalogService) {

    }

    ngOnInit(): void {
        this.showLoadingIndicator();
        this.catalogService.getTemplateDetails(this.dashboardConfig.templateDashboard.id)
        .pipe(catchError(err => {
            console.log('Dashboard Details: Error in primary endpoint using fallback');
            return this.catalogService.getTemplateDetailsFallBack(this.dashboardConfig.templateDashboard.id)
            }))
            .subscribe(templateDetails => {
                this.hideLoadingIndicator();
                // TODO add some checks
                templateDetails.input.devices = this.dashboardConfig.templateDashboard.devices ? this.dashboardConfig.templateDashboard.devices : [];
                templateDetails.input.images = this.dashboardConfig.templateDashboard.binaries ? this.dashboardConfig.templateDashboard.binaries : [];
                templateDetails.input.binaries = this.dashboardConfig.templateDashboard.staticBinaries ? this.dashboardConfig.templateDashboard.staticBinaries : [];
                if(templateDetails.preview) {
                    templateDetails.preview = this.catalogService.getGithubURL(templateDetails.preview);
                }
                this.templateDetails = templateDetails;
            });
    }

    openDeviceSelectorDialog(index: number): void {
        this.deviceSelectorModalRef = this.modalService.show(DeviceSelectorModalComponent, { class: 'c8y-wizard', initialState: {} });
        this.deviceSelectorModalRef.content.onDeviceSelected.subscribe((selectedDevice: IManagedObject) => {
            this.templateDetails.input.devices[index].reprensentation = {
                id: selectedDevice.id,
                name: selectedDevice['name']
            };
        })
    }

    onImageSelected(files: FileList, index: number): void {
        this.catalogService.uploadImage(files.item(0)).then((binaryId: string) => {
            this.templateDetails.input.images[index].id = binaryId;
        });
    }

    showLoadingIndicator(): void {
        this.isLoadingIndicatorDisplayed = true;
    }

    hideLoadingIndicator(): void {
        this.isLoadingIndicatorDisplayed = false;
    }

    onCancelButtonClicked(): void {
        this.modalRef.hide();
    }

    async onSaveButtonClicked(): Promise<void> {
        this.showProgressModalDialog('Update Dashboard ...')

        this.catalogService.updateDashboard(this.app, this.dashboardConfig, this.templateDetails, this.index)
            .then(() => {
                this.hideProgressModalDialog();
                this.modalRef.hide();
            });
    }

    isSaveButtonEnabled(): boolean {
        return this.templateDetails && this.isNameAvailable()
            && (!this.templateDetails.input.devices || this.templateDetails.input.devices.length === 0 || this.isDevicesSelected())
            && (!this.templateDetails.input.images || this.templateDetails.input.images.length === 0 || this.isImagesSelected());
    }

    private showProgressModalDialog(message: string): void {
        this.progressModal = this.modalService.show(ProgressIndicatorModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    private hideProgressModalDialog(): void {
        this.progressModal.hide();
    }

    private isNameAvailable(): boolean {
        return this.dashboardConfig.name && this.dashboardConfig.name.length > 0;
    }

    private isDevicesSelected(): boolean {
        if (!this.templateDetails.input.devices || this.templateDetails.input.devices.length === 0) {
            return true;
        }

        for (let device of this.templateDetails.input.devices) {
            if (!device.reprensentation) {
                return false;
            }
        }

        return true;
    }

    private isImagesSelected(): boolean {
        if (!this.templateDetails.input.images || this.templateDetails.input.images.length === 0) {
            return true;
        }

        for (let image of this.templateDetails.input.images) {
            if (!image.id || image.id.length === 0) {
                return false;
            }
        }

        return true;
    }
}