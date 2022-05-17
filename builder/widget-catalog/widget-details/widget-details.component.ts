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


    constructor(private widgetCatalogService: WidgetCatalogService, private router: Router,
        private modalService: BsModalService, private appService: ApplicationService, private route: ActivatedRoute,
        private alertService: AlertService, private userService: UserService, private appStateService: AppStateService) {
        this.userHasAdminRights = userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN", "ROLE_APPLICATION_MANAGEMENT_ADMIN"]);
    }

    ngOnInit() {
        this.getWidgetID();
        this.widgetCatalogService.widgetDetails$.subscribe(widget => {
            this.widgetDetails = widget;
        });
        if (!this.widgetDetails) {
            this.fetchWidgetDetails();
        }
    }

    getWidgetID() {
        if (!this.route.snapshot.paramMap.has('id')) {
            console.error('Missing id in URL');
            return;
        }
        this.widgetID = this.route.snapshot.paramMap.get('id');
    }

    async fetchWidgetDetails() {
        this.loadWidgetsFromCatalog();
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
                        });
                    }
                    await this.filterInstalledWidgets();
                    this.filterWidgets = (this.widgetCatalog ? this.widgetCatalog.widgets : []);
                    this.filterWidgets.forEach((widget) => {
                        if (this.widgetID === widget.contextPath) {
                            this.widgetCatalogService.setWidgetDetails(widget);
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
            /*  const widgetObj = await new Promise<any>((resolve) => {
                 this.componentService.getById$(widget.id).subscribe(widgetObj => {
                     resolve(widgetObj);
                 });
             }); */
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
        this.loadWidgetsFromCatalog();
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
}
