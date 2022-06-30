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
import { ApplicationService, UserService } from "@c8y/client";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { WidgetCatalog, WidgetModel } from "../widget-catalog.model";
import { WidgetCatalogService } from "../widget-catalog.service";
import { AlertMessageModalComponent } from "../../utils/alert-message-modal/alert-message-modal.component";
import { previewModalComponent } from "../preview-modal/preview-modal.component";
import { AlertService, AppStateService } from "@c8y/ngx-components";
import { ProgressIndicatorModalComponent } from '../../utils/progress-indicator-modal/progress-indicator-modal.component';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from "@angular/router";

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
    filterWidgets: any = [];
    description: any;
    getMoreWidgetsFlag: boolean = false;


    constructor(private widgetCatalogService: WidgetCatalogService, private router: Router,
        private modalService: BsModalService, private appService: ApplicationService, private route: ActivatedRoute,
        private alertService: AlertService, private userService: UserService, private appStateService: AppStateService) {
        this.extractURL();
        this.userHasAdminRights = userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN", "ROLE_APPLICATION_MANAGEMENT_ADMIN"]);
    }

    async ngOnInit() {
        this.getWidgetID();
        this.widgetCatalogService.widgetDetails$.subscribe(widget => {
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
        });
        await this.loadWidgetsFromCatalog();
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

    refresh(action) {
        if (action === 'update') {
            window.location.reload();
        } else if (action === 'uninstall') {
            this.router.navigate(['widget-catalog/my-widgets']);
        }

    }
    private alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }
    private async loadWidgetsFromCatalog() {
        this.appList = (await this.appService.list({ pageSize: 2000 })).data;
        this.appList = this.appList.filter(app => (app.name && app.name.toLowerCase().includes('widget') || app.contextPath && app.contextPath.includes('widget')) && app.manifest && app.manifest.noAppSwitcher === true);
        forkJoin([this.widgetCatalogService.fetchWidgetCatalog(), this.widgetCatalogService.fetchWidgetForDemoCatalog()])
            .subscribe(async ([widgetList1, widgetList2]) => {
                this.widgetCatalog = widgetList1;
                widgetList2.widgets.forEach((widget: WidgetModel) => {
                    const widgetObj = this.widgetCatalog.widgets.find(widgetObj => widgetObj.contextPath === widget.contextPath);
                    if (!widgetObj) {
                        this.widgetCatalog.widgets.push(widget);
                    }
                });
                this.appList.forEach(async app => {
                    const appWidgetObj = this.widgetCatalog.widgets.find(widgetObj => widgetObj.contextPath === app.contextPath);
                    if (!appWidgetObj) {
                        appWidgetObj
                        this.widgetCatalog.widgets.push({
                            contextPath: app.contextPath,
                            title: app.name,
                            icon: (app.icon && app.icon.class ? app.icon.class : 'delete-document'),
                            author: (app.manifest && app.manifest.author ? app.manifest.author : ''),
                            license: (app.manifest && app.manifest.license ? app.manifest.license : ''),
                            requiredPlatformVersion: (app.manifest && app.manifest.requiredPlatformVersion ? app.manifest.requiredPlatformVersion : ''),
                            version: (app.manifest && app.manifest.version ? app.manifest.version : ''),
                            releaseDate: (app.manifest && app.manifest.releaseDate ? app.manifest.releaseDate : '')
                        });
                    }
                    await this.filterInstalledWidgets();
                    this.filterWidgets = (this.widgetCatalog ? this.widgetCatalog.widgets : []);
                    this.filterWidgets.forEach((widget) => {
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
                    });
                });
            }, error => {
                this.alertService.danger("There is some technical error! Please try after sometime.");
            });
    }
    private async filterInstalledWidgets() {
        if (!this.widgetCatalog || !this.widgetCatalog.widgets
            || this.widgetCatalog.widgets.length === 0) {
            return;
        }

        await this.widgetCatalog.widgets.forEach(async widget => {
            widget.isCompatible = this.widgetCatalogService.isCompatiblieVersion(widget);
            const appObj = this.appList.find(app => app.contextPath === widget.contextPath);
            widget.installedVersion = (appObj && appObj.manifest && appObj.manifest.version ? appObj.manifest.version : '');
            widget.installed = appObj && this.findInstalledWidget(widget); //(widgetObj != undefined);
            this.actionFlag(widget);
        });
        this.widgetCatalog.widgets = this.widgetCatalog.widgets.filter(widget => widget.installed);
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
                const widgetAppObj = this.appList.find(app => app.contextPath === widget.contextPath)
                if (widgetAppObj) {
                    await this.appService.delete(widgetAppObj.id);
                    widget.actionCode = '003';
                }
            }
        });
    }
    preview(imageURL: string) {
        this.modalService.show(previewModalComponent, { class: 'modal-lg', initialState: { imageURL } });
    }

    async updateWidget(widget: WidgetModel, bulkUpdate: boolean): Promise<void> {
        const currentHost = window.location.host.split(':')[0];
        if (currentHost === 'localhost' || currentHost === '127.0.0.1' || isDevMode()) {
            this.alertService.warning("Runtime widget installation isn't supported when running Application Builder on localhost or in development mode.");
            return;
        }

        if (!bulkUpdate && widget.actionCode === '002') {
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
                    await this.initiateUpdateWidgetProcess(widget);
                }
            });

        } else { await this.initiateUpdateWidgetProcess(widget); }

    }

    private async initiateUpdateWidgetProcess(widget: WidgetModel) {
        this.showProgressModalDialog(`Updating ${widget.title}`)
        let blob: any;
        let fileName = "";
        if (widget.binaryLink && widget.binaryLink !== '') {
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
        await new Promise<any>((resolve) => {
            this.widgetCatalogService.installWidget(fileOfBlob, widget).then(() => {
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
            if (widget.isCompatible && this.isUpdateAvailable(widget) && !widget.isReloadRequired) { widget.actionCode = '001'; }
            else if (!widget.isCompatible && this.isUpdateAvailable(widget) && !widget.isReloadRequired) { widget.actionCode = '002'; }
            else if (widget.isReloadRequired && !this.isUpdateAvailable(widget)) { widget.actionCode = '003'; }
            else { widget.actionCode = '000'; }
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
        if (currentHost === 'localhost' || currentHost === '127.0.0.1' || isDevMode()) {
            this.alertService.warning("Runtime widget installation isn't supported when running Application Builder on localhost or in development mode.");
            return;
        }

        const appFound = this.appList.find(app => app.name.toLowerCase() === widget.title?.toLowerCase() ||
            (app.contextPath && app.contextPath?.toLowerCase() === widget.contextPath.toLowerCase()))
        if (appFound) {
            this.alertService.danger(" Widget name or context path already exists!");
            return;
        }

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
                    await this.initiateInstallWidgetProcess(widget);
                }
            });

        } else { await this.initiateInstallWidgetProcess(widget); }

    }
    private async initiateInstallWidgetProcess(widget: WidgetModel) {
        this.showProgressModalDialog(`Installing ${widget.title}`)

        this.widgetCatalogService.downloadBinary(widget.binaryLink)
            .subscribe(data => {

                const blob = new Blob([data], {
                    type: 'application/zip'
                });
                const fileName = widget.binaryLink.replace(/^.*[\\\/]/, '');
                const fileOfBlob = new File([blob], fileName);
                this.widgetCatalogService.installWidget(fileOfBlob, widget).then(() => {
                    widget.installed = true;
                    widget.isReloadRequired = true;
                    this.actionFlag(widget);
                    this.hideProgressModalDialog();
                });
            });
    }

    navigateToGridView() {
        if (this.getMoreWidgetsFlag) {
            this.router.navigate(['widget-catalog/get-widgets']);
        } else {
            this.router.navigate(['widget-catalog/my-widgets']);
        }
    }
}
