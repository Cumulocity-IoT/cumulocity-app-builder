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
import { AlertService, DynamicComponentDefinition, DynamicComponentService, PluginsService } from "@c8y/ngx-components";
import { Subject, Subscription, interval } from "rxjs";
import { ProgressIndicatorModalComponent } from "../utils/progress-indicator-modal/progress-indicator-modal.component";

import { WidgetCatalogService } from "../../builder/widget-catalog/widget-catalog.service";
import { catchError } from "rxjs/operators";
import { AccessRightsService } from "../../builder/access-rights.service";
import { ProgressIndicatorService } from "../../builder/utils/progress-indicator-modal/progress-indicator.service";
import { ApplicationBinaryService } from "../../builder/application-binary.service";
import { AlertMessageModalComponent } from "../../builder/utils/alert-message-modal/alert-message-modal.component";


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
    dashboard: any;

    private currentStep: TemplateCatalogStep = TemplateCatalogStep.CATALOG;

    private deviceSelectorModalRef: BsModalRef;

    public templates: Array<TemplateCatalogEntry> = [];

    public filterTemplates: Array<TemplateCatalogEntry> = [];

    public selectedTemplate: TemplateCatalogEntry;

    public templateDetails: TemplateDetails;

    public isLoadingIndicatorDisplayed = false;

    public searchTemplate = '';

    public dashboardPath: string = null;

    public assetButtonText = "Device/Asset";

    private groupTemplate = false;

    private appList = [];

    public dashboardConfiguration = {
        dashboardId: '12598412',
        dashboardName: '',
        dashboardIcon: 'th',
        deviceId: '',
        tabGroup: '',
        dashboardVisibility: '',
        roles: '',
        templateType: 0 // 0: default, 1: group, 2: type
    };

    public selectedDevice: IManagedObject;

    public onSave: Subject<boolean>;
    public onCancel: Subject<boolean>;

    private isReloadRequired = false;

    private progressModal: BsModalRef;

    globalRoles: any;

    private microserviceDownloadProgress = interval(3000);
    private microserviceDownloadProgress$: Subscription;
    isMSEnabled: boolean = false;

    constructor(private modalService: BsModalService, private modalRef: BsModalRef, private appService: ApplicationService,
        private catalogService: TemplateCatalogService, private componentService: DynamicComponentService,
        private alertService: AlertService, private widgetCatalogService: WidgetCatalogService,
        private applicationBinaryService: ApplicationBinaryService, private pluginsService: PluginsService,
        private accessRightsService: AccessRightsService, private progressIndicatorService: ProgressIndicatorService) {
        this.onSave = new Subject();
        this.onCancel = new Subject();
    }

    async ngOnInit() {
        
        this.globalRoles = await this.accessRightsService.getAllGlobalRoles();
        if(this.dashboard ) {
            this.selectedTemplate = this.dashboard;
            this.dashboardConfiguration.dashboardName = this.dashboard.title;
            this.showDetailPage();
            this.loadTemplateDetails(this.dashboard);
        } else {
            this.loadTemplateCatalog();
        }
        this.appList = (await this.appService.list({ pageSize: 2000 })).data;
        this.isMSEnabled =  this.applicationBinaryService.isMicroserviceEnabled(this.appList);
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

    async updateDepedencies() {
        if (!this.templateDetails || !this.templateDetails.input || !this.templateDetails.input.dependencies
            || this.templateDetails.input.dependencies.length === 0) {
            return;
        }

        for (let dependency of this.templateDetails.input.dependencies) {
            if (dependency.type && dependency.type == "microservice") {
                dependency.isInstalled = (await this.applicationBinaryService.verifyExistingMicroservices(dependency.id)) as any;;
                dependency.isSupported = true;
                dependency.visible = true;
            } else {
                this.verifyWidgetCompatibility(dependency);
                if(dependency.ids && dependency.ids.length > 0) {
                    Promise.all(dependency.ids.map( async id => {
                        return ( await this.componentService.getById(id) ? true : false);
                    })).then ((widgetStatusList: boolean[]) => {
                        const widgetObj =  widgetStatusList.find(widget => !widget);
                        dependency.isInstalled = (widgetObj == undefined);
                    })
                } else  {
                    this.componentService.getById(dependency.id).then(widget => {
                        dependency.isInstalled = (widget != undefined);
                    });
                }
            }
        };
    }

    showDetailPage(): void {
        this.currentStep = TemplateCatalogStep.DETAIL_PAGE;
    }

    showCatalogPage(): void {
        this.currentStep = TemplateCatalogStep.CATALOG;
    }

    openDeviceSelectorDialog(index: number, templateType: number): void {
       
        switch (templateType) {
            case 1:
                this.assetButtonText = "Device Group";
                this.groupTemplate = true;
                break;
            case 2:
                this.assetButtonText = "Device/Asset Type";
                this.groupTemplate = true;
                break;
            default:
                this.assetButtonText = "Device/Asset";
                this.groupTemplate = false;
                break;
        }
        this.dashboardConfiguration.templateType = templateType;

        this.deviceSelectorModalRef = this.modalService.show(DeviceSelectorModalComponent, { class: 'c8y-wizard', initialState: {templateType} });
        if(templateType == 2) {
            this.deviceSelectorModalRef.content.onTypeSelected.subscribe((selectedType: string) => {
                this.templateDetails.input.devices[index].reprensentation = {
                    id: selectedType,
                    name: selectedType
                };
    
            });
        } else {
            this.deviceSelectorModalRef.content.onDeviceSelected.subscribe((selectedDevice: IManagedObject) => {
                this.templateDetails.input.devices[index].reprensentation = {
                    id: selectedDevice.id,
                    name: selectedDevice['name']
                };
            })
        }
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
        this.onCancel.next(true);
        this.modalRef.hide();
    }

    async onSaveButtonClicked() {
        this.showProgressModalDialog('Create Dashboard ...')
        this.dashboardConfiguration.dashboardName = (this.dashboardPath ? `${this.dashboardPath}/${this.dashboardConfiguration.dashboardName}` : this.dashboardConfiguration.dashboardName);
        await this.catalogService.createDashboard(this.app, this.dashboardConfiguration, this.selectedTemplate, this.templateDetails, this.groupTemplate);

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
            this.alertService.warning("Installation isn't supported when running Application Builder on localhost.");
            return;
        } 
        if (dependency.type === "microservice") { // installing plugin
            this.showProgressModalDialog(`Downloading ${dependency.title}`);
            this.progressIndicatorService.setProgress(10);
            await new Promise(resolve => setTimeout(resolve, 1000));
            let counter = 10;
            this.microserviceDownloadProgress$ = this.microserviceDownloadProgress.subscribe(async val => {
                counter++;
                if (counter <= 40) {
                    this.progressIndicatorService.setProgress(counter);
                }
            });
            this.catalogService.downloadBinary(dependency.link)
                .then(async blob => {
                    let createdApp = null;
                    this.microserviceDownloadProgress$.unsubscribe();
                    try {
                        this.progressIndicatorService.setProgress(40);
                        this.progressIndicatorService.setMessage(`Installing ${dependency.title}`);
                       
                        const fileName = dependency.link.replace(/^.*[\\\/]/, '');
                        const fileOfBlob = new File([blob], fileName);

                        const createdApp = await this.applicationBinaryService.createAppForMicroservice(fileOfBlob, dependency);
                        this.progressIndicatorService.setProgress(50);
                        counter = 50;
                        this.microserviceDownloadProgress$ = this.microserviceDownloadProgress.subscribe(async val => {
                            counter++;
                            if (counter <= 80) {
                                this.progressIndicatorService.setProgress(counter);
                            }
                        });
                        await this.applicationBinaryService.uploadMicroservice(fileOfBlob, createdApp);
                        this.microserviceDownloadProgress$.unsubscribe();
                        this.progressIndicatorService.setProgress(80);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        this.hideProgressModalDialog();
                        dependency.isInstalled = true;
                        this.isReloadRequired = true;
                    } catch (ex) {
                        createdApp = null;
                        this.alertService.danger("There is some technical error! Please try after sometime.");
                        console.error(ex.message);
                    }
                }).catch(err => {
                    this.hideProgressModalDialog();
                    this.loadErrorMessageDialog();
                });
            
        } else { // installing plugin

            const packageList = await this.pluginsService.listPackages(); 
            const widgetBinaryFound = packageList.find(app => (app.name.toLowerCase() === dependency.title?.toLowerCase() ||
                (app.contextPath && app.contextPath?.toLowerCase() === dependency?.contextPath?.toLowerCase())));
            this.showProgressModalDialog(`Installing ${dependency.title}`);
            this.progressIndicatorService.setProgress(10);
            if (widgetBinaryFound) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                this.progressIndicatorService.setProgress(30);
                this.widgetCatalogService.updateRemotesInCumulocityJson(widgetBinaryFound, true).then(async () => {
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
                    .then(blob => {
                        this.progressIndicatorService.setProgress(20);
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
                    }).catch(err => {
                        this.hideProgressModalDialog();
                        this.loadErrorMessageDialog();
                    });
            }
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
    private loadErrorMessageDialog() {
        const alertMessage = {
          title: 'Microservice needed!',
          description: `'Cumulocity Community Utils' microservice is not installed or subscribed. Please download the microservice, then install and subscribe to it by navigating to Administration -> Ecosystems -> Microservices. `,
          type: 'danger',
          externalLink: "https://labcase.softwareag.com/storage/d/a02221e54739758ccb1ab839ce09e2cc",
          externalLinkLabel: "Download the microservice now.",
          alertType: 'info' //info|confirm
        }
        this.alertModalDialog(alertMessage);
      }

      alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }
}
