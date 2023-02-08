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
import { ApplicationService, IManagedObject } from '@c8y/client';
import { DeviceSelectorModalComponent } from "../utils/device-selector-modal/device-selector.component";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { DependencyDescription, TemplateCatalogEntry, TemplateDetails } from "./template-catalog.model";
import { TemplateCatalogService } from "./template-catalog.service";
import { AlertService, DynamicComponentDefinition, DynamicComponentService } from "@c8y/ngx-components";
import { Observable, Subject } from "rxjs";
import { ProgressIndicatorModalComponent } from "../utils/progress-indicator-modal/progress-indicator-modal.component";

import './cumulocity.json';
import { WidgetCatalogService } from "../../builder/widget-catalog/widget-catalog.service";
import { catchError } from "rxjs/operators";
import { AccessRightsService } from "../../builder/access-rights.service";
import { ProgressIndicatorService } from "../../builder/utils/progress-indicator-modal/progress-indicator.service";


enum TemplateCatalogStep {
    CATALOG,
    DETAIL_PAGE
}

@Component({
    selector: 'template-catalog',
    templateUrl: './template-catalog.component.html',
    styleUrls: ['template-catalog.less']
})
export class TemplateCatalogModalComponent implements OnInit {

    app: any;

    private currentStep: TemplateCatalogStep = TemplateCatalogStep.CATALOG;

    private deviceSelectorModalRef: BsModalRef;

    public templates: Array<TemplateCatalogEntry> = [];

    public filterTemplates: Array<TemplateCatalogEntry> = [];

    public selectedTemplate: TemplateCatalogEntry;

    public templateDetails: TemplateDetails;

    public isLoadingIndicatorDisplayed = false;

    public searchTemplate = '';

    public dashboardPath: string = null;

    private appList = [];

    public dashboardConfiguration = {
        dashboardId: '12598412',
        dashboardName: '',
        dashboardIcon: 'th',
        deviceId: '',
        tabGroup: '',
        dashboardVisibility: '',
        roles: ''
    };

    public selectedDevice: IManagedObject;

    public onSave: Subject<boolean>;

    private isReloadRequired = false;

    private progressModal: BsModalRef;

    globalRoles: any;

    constructor(private modalService: BsModalService, private modalRef: BsModalRef, private appService: ApplicationService,
        private catalogService: TemplateCatalogService, private componentService: DynamicComponentService,
        private alertService: AlertService, private widgetCatalogService: WidgetCatalogService,
        private accessRightsService: AccessRightsService, private progressIndicatorService: ProgressIndicatorService) {
        this.onSave = new Subject();
    }

    async ngOnInit() {
        this.loadTemplateCatalog();
        this.globalRoles = await this.accessRightsService.getAllGlobalRoles();
    }

    loadTemplateCatalog(): void {
        this.showLoadingIndicator();
        this.catalogService.getTemplateCatalog()
            .pipe(catchError(err => {
                console.log('Dashboard Catalog: Error in primary endpoint! using fallback...');
                return this.catalogService.getTemplateCatalogFallBack()
            }))
            .subscribe((catalog: Array<TemplateCatalogEntry>) => {
                this.hideLoadingIndicator();
                this.templates = catalog;
                this.filterTemplates = (this.templates ? this.templates : []);
                this.filterTemplates.forEach(template => {
                    if (template.thumbnail && template?.thumbnail != '') {
                        template.thumbnail = this.catalogService.getGithubURL(template.thumbnail);
                    }
                })
            }, error => {
                this.alertService.danger("There is some technical error! Please try after sometime.");
                this.hideLoadingIndicator();
            });
    }

    onTemplateClicked(template: TemplateCatalogEntry): void {
        this.selectedTemplate = template;
        this.showDetailPage();
        this.loadTemplateDetails(template);
    }

    async loadTemplateDetails(template: TemplateCatalogEntry): Promise<void> {
        this.showLoadingIndicator();
        this.appList = (await this.appService.list({ pageSize: 2000 })).data;
        this.catalogService.getTemplateDetails(template.dashboard)
            .pipe(catchError(err => {
                console.log('Dashboard Catalog Details: Error in primary endpoint! using fallback...');
                return this.catalogService.getTemplateDetailsFallBack(template.dashboard);
            }))
            .subscribe(templateDetails => {
                this.hideLoadingIndicator();
                this.templateDetails = templateDetails;
                if (this.templateDetails.preview) {
                    this.templateDetails.preview = this.catalogService.getGithubURL(this.templateDetails.preview);
                }
                this.updateDepedencies();
            });
    }

    updateDepedencies() {
        if (!this.templateDetails || !this.templateDetails.input || !this.templateDetails.input.dependencies
            || this.templateDetails.input.dependencies.length === 0) {
            return;
        }

        this.templateDetails.input.dependencies.forEach(dependency => {
            this.verifyWidgetCompatibility(dependency);
            this.componentService.getById(dependency.id).then(widget => {
                dependency.isInstalled = (widget != undefined);
            });
        });
    }

    showDetailPage(): void {
        this.currentStep = TemplateCatalogStep.DETAIL_PAGE;
    }

    showCatalogPage(): void {
        this.currentStep = TemplateCatalogStep.CATALOG;
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

    resetTemplateDetails(): void {
        this.selectedTemplate = undefined;
        this.templateDetails = undefined;
    }

    onBackButtonClicked(): void {
        this.resetTemplateDetails();
        this.showCatalogPage();
    }

    onCancelButtonClicked(): void {
        this.modalRef.hide();
    }

    async onSaveButtonClicked() {
        this.showProgressModalDialog('Create Dashboard ...')
        this.dashboardConfiguration.dashboardName = (this.dashboardPath ? `${this.dashboardPath}/${this.dashboardConfiguration.dashboardName}` : this.dashboardConfiguration.dashboardName);
        await this.catalogService.createDashboard(this.app, this.dashboardConfiguration, this.selectedTemplate, this.templateDetails);

        this.hideProgressModalDialog();
        this.onSave.next(this.isReloadRequired);
        this.modalRef.hide();
    }

    isSaveButtonEnabled(): boolean {
        return this.templateDetails && this.isNameAvailable()
            && (!this.templateDetails.input.devices || this.templateDetails.input.devices.length === 0 || this.isDevicesSelected())
            && (!this.templateDetails.input.images || this.templateDetails.input.images.length === 0 || this.isImagesSelected());
    }

    isCatalogDisplayed(): boolean {
        return this.currentStep == TemplateCatalogStep.CATALOG;
    }

    isDetailPageDisplayed(): boolean {
        return this.currentStep == TemplateCatalogStep.DETAIL_PAGE;
    }

    showLoadingIndicator(): void {
        this.isLoadingIndicatorDisplayed = true;
    }

    hideLoadingIndicator(): void {
        this.isLoadingIndicatorDisplayed = false;
    }

    showProgressModalDialog(message: string): void {
        this.progressModal = this.modalService.show(ProgressIndicatorModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    hideProgressModalDialog(): void {
        this.progressModal.hide();
    }

    isWidgetInstalled(dependency: DependencyDescription): Promise<DynamicComponentDefinition> {
        return this.componentService.getById(dependency.id);
    }

    async installDependency(dependency: DependencyDescription): Promise<void> {
        const currentHost = window.location.host.split(':')[0];
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            this.alertService.warning("Runtime widget installation isn't supported when running Application Builder on localhost.");
            return;
        }
        const widgetBinaryFound = this.appList.find(app => app.manifest?.isPackage && (app.name.toLowerCase() === dependency.title?.toLowerCase() ||
            (app.contextPath && app.contextPath?.toLowerCase() === dependency?.contextPath?.toLowerCase())));
        this.showProgressModalDialog(`Installing ${dependency.title}`);
        if (widgetBinaryFound) {
            this.progressIndicatorService.setProgress(10);
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.progressIndicatorService.setProgress(30);
            this.widgetCatalogService.updateRemotesInCumulocityJson(widgetBinaryFound).then(async () => {
                dependency.isInstalled = true;
                this.isReloadRequired = true;
                await new Promise(resolve => setTimeout(resolve, 1000));
                this.hideProgressModalDialog();
            }, error => {
                this.alertService.danger("There is some technical error! Please try after sometime.");
                console.error(error);
            });
        } else {
            this.progressIndicatorService.setProgress(10);
            this.catalogService.downloadBinary(dependency.link)
                .subscribe(data => {
                    this.progressIndicatorService.setProgress(20);
                    const blob = new Blob([data], {
                        type: 'application/zip'
                    });
                    const fileName = dependency.link.replace(/^.*[\\\/]/, '');
                    const fileOfBlob = new File([blob], fileName);
                    this.widgetCatalogService.installPackage(fileOfBlob).then(async () => {
                        dependency.isInstalled = true;
                        this.isReloadRequired = true;
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        this.hideProgressModalDialog();
                    }, error => {
                        this.alertService.danger("There is some technical error! Please try after sometime.");
                        console.error(error);
                    });
                });
        }
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

    private isNameAvailable(): boolean {
        return this.dashboardConfiguration.dashboardName && this.dashboardConfiguration.dashboardName.length >= 0;
    }

    private verifyWidgetCompatibility(dependency: DependencyDescription) {
        if (this.widgetCatalogService.isCompatiblieVersion(dependency)) {
            dependency.isSupported = true;
            dependency.visible = true;
        } else {
            const differentDependencyVersion = this.templateDetails.input.dependencies.find(widget => widget.id === dependency.id && widget.link !== dependency.link);
            dependency.isSupported = false;
            if (differentDependencyVersion) {
                dependency.visible = false;
            } else { dependency.visible = true; }
        }
    }

    downloadDTDL(uri: string) {
        const dtdlLink = document.createElement("a");
        dtdlLink.href = this.catalogService.getGithubURL(uri);;
        document.body.appendChild(dtdlLink);
        dtdlLink.click();
        document.body.removeChild(dtdlLink);
    }

    applyFilter() {
        if (this.templates && this.templates.length > 0) {
            this.filterTemplates = this.templates.filter((template => template.title.toLowerCase().includes(this.searchTemplate.toLowerCase())));
            this.filterTemplates = [...this.filterTemplates];
        }

    }
}
