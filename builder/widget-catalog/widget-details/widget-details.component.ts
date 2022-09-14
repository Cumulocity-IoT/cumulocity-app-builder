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

import { Component, isDevMode, OnInit } from "@angular/core";
import { ApplicationService, IApplication, UserService } from "@c8y/client";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { WidgetCatalog, WidgetModel } from "../widget-catalog.model";
import { WidgetCatalogService } from "../widget-catalog.service";
import { AlertMessageModalComponent } from "../../utils/alert-message-modal/alert-message-modal.component";
import { previewModalComponent } from "../preview-modal/preview-modal.component";
import { AlertService, AppStateService } from "@c8y/ngx-components";
import { ProgressIndicatorModalComponent } from '../../utils/progress-indicator-modal/progress-indicator-modal.component';
import { forkJoin, interval } from 'rxjs';
import { ActivatedRoute, Router } from "@angular/router";
import { ProgressIndicatorService } from "../../utils/progress-indicator-modal/progress-indicator.service";

@Component({
    selector: 'widget-details',
    templateUrl: './widget-details.component.html',
    styleUrls: ['./widget-details.component.less']
})

export class WidgetDetailsComponent implements OnInit {
    widgetDetails: any;
    private appList = [];
    private progressModal: BsModalRef;
    userHasAdminRights: boolean;
    widgetCatalog: WidgetCatalog;
    widgetID: string;
    description: any;
    getMoreWidgetsFlag: boolean = false;
    searchWidget: any;


    constructor(private widgetCatalogService: WidgetCatalogService, private router: Router,
        private modalService: BsModalService, private appService: ApplicationService, private route: ActivatedRoute,
        private alertService: AlertService, private userService: UserService, private appStateService: AppStateService,
        private progressIndicatorService: ProgressIndicatorService) {
        this.extractURL();
        this.userHasAdminRights = userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN", "ROLE_APPLICATION_MANAGEMENT_ADMIN"]);
    }

    async ngOnInit() {
        this.getWidgetID();
        this.widgetCatalogService.widgetDetails$.subscribe((widget) => {
            if (widget) {
                this.widgetDetails = widget;
                if (widget && widget.repository) {
                    let repoURL = widget.repository.split('SoftwareAG')[1];
                    let repoName = repoURL.substring(
                        repoURL.indexOf("/") + 0,
                        repoURL.lastIndexOf("#")
                    );
                    this.widgetCatalogService.getWidgetDetailsFromRepo(repoName).subscribe((data) => {
                        let widgetdata = JSON.stringify(data);
                        this.fetchWidgetDescription(widgetdata);
                    });
                }
            } else {
                this.navigateToGridView();
            }
            
        });
        if (this.widgetCatalogService.runtimeLoadingCompleted) {
            this.loadWidgetsFromCatalog();
        } else {
            const waitForWidgetLoaderInt = interval(1000);
            const waitForWidgetLoaderSub = waitForWidgetLoaderInt.subscribe(async val => {
                if (this.widgetCatalogService.runtimeLoadingCompleted) {
                    waitForWidgetLoaderSub.unsubscribe();
                    this.loadWidgetsFromCatalog();
                }
            });
        }

    }

    fetchWidgetDescription(widgetData) {
        this.description = widgetData;
        const regex1 = widgetData.match("^(.*?)## Installation");
        this.description = regex1[0];
        if (this.description.match(/### Installation/g))
            this.description = this.description.replace("### Installation", '');
        else
            this.description = this.description.replace("## Installation", '');
        this.description = this.description.replace(/\\n/g, "<br />");
        this.description = this.description.replace(/<img[^>]+>/g, "");
        this.description = this.description.replace(/(?:https?):\/\/[\n\S]+/g, '');
        if (this.description.match(/### Please(.*?)/g)) {
            if (this.description.match("### Please(.*?)## Features")) {
                const regex2 = this.description.match("### Please(.*?)## Features");
                this.description = this.description.replace(regex2[1], "");
            } else {
                const regex2 = this.description.match(/### Please(.*)/g);
                this.description = this.description.replace(regex2[0], "");
            }
        }
        const regex3 = this.description.match("#(.*?)/>");
        this.description = this.description.replace(regex3[1], "");
        this.description = this.description.replace(/(?:<br \/>\s*){2,}/, "");
        this.description = this.description.replace(/(?:<br \/>\s*){2,}/g, '<br /><br />');
        this.description = this.description.replace("## Features", "\n#### **Features**\n");
        if (this.description.match(/(\!).*?(?=\])/g))
            this.description = this.description.replace(/(\!).*?(?=\])/g, "");
        if (this.description.match(/## Prerequisite(.*)/g))
            this.description = this.description.replace("## Prerequisite", "\n#### **Prerequisite**\n");
        if (this.description.match(/## Supported(.*)/g))
            this.description = this.description.replace("## Supported Cumulocity Environments", "\n#### **Supported Cumulocity Environments**\n");
        if (this.description.match(/(\|).*?(?=\|)/g))
            this.description = this.description.replace(/(\|).*?(?=\|)/g, '');
        if (this.description.match(/(\().*?(?=\))/g))
            this.description = this.description.replace(/(\().*?(?=\))/g, '');
        this.description = this.replaceWithEmptyString({ '[](': '', '( />': '', ']': '', '### Please': '', '#/>': '', '"': '', '|': '' });
    }
    replaceWithEmptyString(obj) {
        for (let x in obj) {
            this.description = this.description.replace(x, obj[x]);
        }
        return this.description;
    }

    extractURL() {
        let url = window.location.href;
        let path = url.split('/');
        for (let p in path) {
            if (path[p] === "get-widgets") {
                this.getMoreWidgetsFlag = true;
                break;
            } else {
                this.getMoreWidgetsFlag = false;
            }
        }
    }

    getWidgetID() {
        if (!this.route.snapshot.paramMap.has('id')) {
            console.error('Missing id in URL');
            return;
        }
        this.widgetID = this.route.snapshot.paramMap.get('id');
    }

    openDocumentation(url: string) {
        window.open(url);
    }

    refresh() {
        window.location.reload();
    }
    private alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }
    private async loadWidgetsFromCatalog() {
        this.appList = (await this.appService.list({ pageSize: 2000 })).data;
        this.appList = this.appList.filter(app => (app.name && app.name.toLowerCase().includes('widget') || app.contextPath && app.contextPath.includes('widget')) && app.manifest && app.manifest.noAppSwitcher === true);
        await this.widgetCatalogService.fetchWidgetCatalog()
            .subscribe(async (widgetCatalog: WidgetCatalog) => {
                this.widgetCatalog = widgetCatalog;
                await this.filterInstalledWidgets();
            }, error => {
                this.alertService.danger("There is some technical error! Please try after sometime.");
            });
    }
    private async filterInstalledWidgets() {
        if (!this.widgetCatalog || !this.widgetCatalog.widgets
            || this.widgetCatalog.widgets.length === 0) {
            return;
        }

        const currentApp: IApplication = (await this.widgetCatalogService.getCurrentApp());
        const installedPlugins = currentApp?.manifest?.remotes;
        for (let widget of this.widgetCatalog.widgets) {
            widget.isCompatible = this.widgetCatalogService.isCompatiblieVersion(widget);
            const appObj = this.appList.find(app => app.contextPath === widget.contextPath);
            const widgetObj = (installedPlugins && installedPlugins[widget.contextPath] && installedPlugins[widget.contextPath].length > 0);
            widget.installedVersion = (widgetObj && appObj && appObj.manifest && appObj.manifest.version ? appObj.manifest.version : '');
            widget.installed = widgetObj && this.findInstalledWidget(widget); //(widgetObj != undefined);
            this.actionFlag(widget);
        }

        this.widgetCatalog.widgets = this.widgetCatalog.widgets.filter(widget => !widget.installed);
        /*this.widgetCatalog.widgets.forEach((widget) => {
            if (this.widgetID === widget.contextPath) {
                this.widgetCatalogService.setWidgetDetails(widget);
                if (widget && widget.repository) {
                    let repoURL = widget.repository.split('SoftwareAG')[1];
                    let repoName = repoURL.substring(
                        repoURL.indexOf("/") + 0,
                        repoURL.lastIndexOf("#")
                    );
                    this.widgetCatalogService.getWidgetDetailsFromRepo(repoName).subscribe((data) => {
                        let widgetdata = JSON.stringify(data);
                        this.fetchWidgetDescription(widgetdata);
                    });
                }
            }
        });*/
    }

    // if same widget exists in widget catalog json more than one time with different version
    private findInstalledWidget(widget: WidgetModel) {
        const checkWidgetInCatalog = this.widgetCatalog.widgets.filter(widgetCatalogWidget => widgetCatalogWidget.contextPath === widget.contextPath);
        if (checkWidgetInCatalog && checkWidgetInCatalog.length > 1) {
            const isWidgetInstalled = checkWidgetInCatalog.find(installObj => installObj.installed);
            if (isWidgetInstalled) return false;
            return widget.isCompatible && this.widgetCatalogService.checkInstalledVersion(widget);
        }
        return true;
    }

    async uninstallWidget(widget: WidgetModel) {
        const alertMessage = {
            title: 'Uninstall widget',
            description: `You are about to uninstall ${widget.title}.
                Do you want to proceed?`,
            type: 'danger',
            alertType: 'confirm', //info|confirm
            confirmPrimary: true //confirm Button is primary
        }
        const installDemoDialogRef = this.alertModalDialog(alertMessage);
        await installDemoDialogRef.content.event.subscribe(async data => {
            if (data && data.isConfirm) {
                this.showProgressModalDialog(`Uninstalling ${widget.title}`);
                this.progressIndicatorService.setProgress(5);
                await new Promise(resolve => setTimeout(resolve, 1000)); 
                const currentApp: IApplication = (await this.widgetCatalogService.getCurrentApp());
                this.progressIndicatorService.setProgress(15);
                await new Promise(resolve => setTimeout(resolve, 1000)); 
                let remotes = currentApp?.manifest?.remotes;
                const widgetAppObj = this.appList.find(app => app.contextPath === widget.contextPath)
                if (widgetAppObj) {
                    this.progressIndicatorService.setProgress(30);
                    await new Promise(resolve => setTimeout(resolve, 1000)); 
                    const remoteModules = widgetAppObj?.manifest?.exports;
                    remoteModules.forEach((remote: any) => {
                        (remotes[widget.contextPath] = remotes[widget.contextPath].filter((p) => p !== remote.module));
                    });
                    this.progressIndicatorService.setProgress(50);
                    await this.widgetCatalogService.removePlugin(remotes);
                    this.hideProgressModalDialog();
                    widget.actionCode = '003';
                }
            }
        });
    }
    preview(imageURL: string) {
        this.modalService.show(previewModalComponent, { class: 'modal-lg', initialState: { imageURL } });
    }

    async updateWidget(widget: WidgetModel): Promise<void> {
        const currentHost = window.location.host.split(':')[0];
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            this.alertService.warning("Runtime widget installation isn't supported when running Application Builder on localhost or in development mode.");
            return;
        }

        if (widget.actionCode === '002') {
            const alertMessage = {
                title: 'Update Confirmation',
                description: `${widget.title} is not supported by current version of application builder and may not work properly.
                Do you want to proceed?`,
                type: 'warning',
                alertType: 'confirm', //info|confirm
                confirmPrimary: false //confirm Button is primary
            }
            const installDemoDialogRef = this.alertModalDialog(alertMessage);
            await installDemoDialogRef.content.event.subscribe(async data => {
                if (data && data.isConfirm) {
                    this.progressIndicatorService.setProgress(5);
                    await this.initiateUpdateWidgetProcess(widget);
                }
            });

        } else { 
            this.progressIndicatorService.setProgress(5);
            await this.initiateUpdateWidgetProcess(widget);
         }

    }

    private async initiateUpdateWidgetProcess(widget: WidgetModel) {
        this.showProgressModalDialog(`Updating ${widget.title}`);
        this.progressIndicatorService.setProgress(10);
        let blob: any;
        let fileName = "";
        if (widget.binaryLink && widget.binaryLink !== '') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.progressIndicatorService.setProgress(15);
            blob = await new Promise<any>((resolve) => {
                this.widgetCatalogService.downloadBinary(widget.binaryLink)
                    .subscribe(data => {
                        const blob = new Blob([data], {
                            type: 'application/zip'
                        });
                        resolve(blob);
                    });
            });
            fileName = widget.binaryLink.replace(/^.*[\\\/]/, '');
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.progressIndicatorService.setProgress(15);
            blob = await new Promise<any>((resolve) => {
                this.widgetCatalogService.downloadBinaryFromLabcase(widget.link)
                    .subscribe(data => {
                        const blob = new Blob([data], {
                            type: 'application/zip'
                        });
                        resolve(blob);
                    });
            });
            fileName = widget.fileName;
        }
        const fileOfBlob = new File([blob], fileName);
        this.progressIndicatorService.setProgress(30);
        await new Promise<any>((resolve) => {
            this.widgetCatalogService.installPackage(fileOfBlob).then(() => {
                widget.isReloadRequired = true;
                widget.installedVersion = widget.version;
                this.actionFlag(widget);
                this.hideProgressModalDialog();
                resolve(true);
            });
        });
    }

    showProgressModalDialog(message: string): void {
        this.progressModal = this.modalService.show(ProgressIndicatorModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    hideProgressModalDialog(): void {
        this.progressModal.hide();
    }

    private actionFlag(widget: WidgetModel) {

        if (this.userHasAdminRights) {
            if (!this.getMoreWidgetsFlag) {
                if (widget.isCompatible && this.isUpdateAvailable(widget) && !widget.isReloadRequired) { widget.actionCode = '001'; }
                else if (!widget.isCompatible && this.isUpdateAvailable(widget) && !widget.isReloadRequired) { widget.actionCode = '002'; }
                else if (widget.isReloadRequired && !this.isUpdateAvailable(widget)) { widget.actionCode = '003'; }
                else { widget.actionCode = '000'; }
            } else {
                if (widget.isCompatible && !widget.installed) { widget.actionCode = '001'; }
                else if (!widget.isCompatible && !widget.installed) { widget.actionCode = '002'; }
                else if (widget.isReloadRequired && widget.installed) { widget.actionCode = '003'; }
                else { widget.actionCode = '000'; }
            }
        } else {
            widget.actionCode = '000';
        }
    }

    isUpdateAvailable(widget: WidgetModel) {
        if (!widget.binaryLink && !widget.link) { return false }
        if (!widget.installedVersion && widget.installedVersion === '') {
            return true;
        }
        return this.widgetCatalogService.isLatestVersionAvailable(widget);
    }

    async installWidget(widget: WidgetModel): Promise<void> {
        const currentHost = window.location.host.split(':')[0];
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            this.alertService.warning("Runtime widget installation isn't supported when running Application Builder on localhost or in development mode.");
            return;
        }

        const widgetBinaryFound = this.appList.find(app => app.manifest?.isPackage && (app.name.toLowerCase() === widget.title?.toLowerCase() ||
            (app.contextPath && app.contextPath?.toLowerCase() === widget.contextPath.toLowerCase())))

        if (widget.actionCode === '002' || widget.isDeprecated) {
            let alertMessage = {};
            if (widget.actionCode === '002') {
                alertMessage = {
                    title: 'Installation Confirmation',
                    description: `${widget.title} is not supported by current version of application builder and may not work properly.
                    Do you want to proceed?`,
                    type: 'warning',
                    alertType: 'confirm', //info|confirm
                    confirmPrimary: false //confirm Button is primary
                }
            } else {
                alertMessage = {
                    title: 'Installation Confirmation',
                    description: `${widget.title} is deprecated. Please refer documentation for more detail.
                    Do you want to proceed?`,
                    type: 'warning',
                    alertType: 'confirm', //info|confirm
                    confirmPrimary: false //confirm Button is primary
                }
            }

            const installDemoDialogRef = this.alertModalDialog(alertMessage);
            await installDemoDialogRef.content.event.subscribe(async data => {
                if (data && data.isConfirm) {
                    this.progressIndicatorService.setProgress(5);
                    await this.initiateInstallWidgetProcess(widget, widgetBinaryFound);
                }
            });

        } else { 
            this.progressIndicatorService.setProgress(5);
            await this.initiateInstallWidgetProcess(widget, widgetBinaryFound); 
        }

    }
    private async initiateInstallWidgetProcess(widget: WidgetModel, widgetBinary) {
        this.showProgressModalDialog(`Installing ${widget.title}`);
        this.progressIndicatorService.setProgress(10);
        if (widgetBinary) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.progressIndicatorService.setProgress(30);
            this.widgetCatalogService.updateRemotesInCumulocityJson(widgetBinary).then(() => {
                widget.installed = true;
                widget.isReloadRequired = true;
                this.actionFlag(widget);
                this.hideProgressModalDialog();
            }, error => {
                this.alertService.danger("There is some technical error! Please try after sometime.");
                console.error(error);
            });
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.progressIndicatorService.setProgress(15);
            this.widgetCatalogService.downloadBinary(widget.binaryLink)
                .subscribe(data => {
                    this.progressIndicatorService.setProgress(20);
                    const blob = new Blob([data], {
                        type: 'application/zip'
                    });
                    const fileName = widget.binaryLink.replace(/^.*[\\\/]/, '');
                    const fileOfBlob = new File([blob], fileName);
                    this.widgetCatalogService.installPackage(fileOfBlob).then(() => {
                        this.progressIndicatorService.setProgress(25);
                        widget.installed = true;
                        widget.isReloadRequired = true;
                        this.actionFlag(widget);
                        this.hideProgressModalDialog();
                    });
                });
        }
    }

    navigateToGridView() {
        if (this.getMoreWidgetsFlag) {
            this.router.navigate(['widget-catalog/get-widgets']);
        } else {
            this.router.navigate(['widget-catalog/my-widgets']);
        }
    }
}
