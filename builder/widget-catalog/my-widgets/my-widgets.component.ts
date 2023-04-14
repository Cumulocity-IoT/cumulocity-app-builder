/*
* Copyright (c) 2022 Software AG, Darmstadt, Germany and/or its licensors
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

import { Component, isDevMode, OnDestroy, OnInit } from "@angular/core";
import {
    ApplicationService,
    UserService,
    IApplication,
    FetchClient
} from "@c8y/client";
import { AlertService, AppStateService, DynamicComponentService, PluginsService } from "@c8y/ngx-components";
import { ProgressIndicatorModalComponent } from '../../utils/progress-indicator-modal/progress-indicator-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { previewModalComponent } from '../preview-modal/preview-modal.component';
import { WidgetCatalog, WidgetModel } from '../widget-catalog.model';
import { WidgetCatalogService } from '../widget-catalog.service';
import { concat, forkJoin, from, fromEvent, interval, Observable, of } from 'rxjs';
import { AlertMessageModalComponent } from "../../utils/alert-message-modal/alert-message-modal.component";
import { ActivatedRoute, Router } from "@angular/router";
import { ProgressIndicatorService } from "../../utils/progress-indicator-modal/progress-indicator.service";

@Component({
    templateUrl: './my-widgets.component.html',
    styleUrls: ['./my-widgets.component.less']
})

export class MyWidgetsComponent implements OnInit {

    private progressModal: BsModalRef;
    private appList = [];

    userHasAdminRights: boolean;
    isBusy: boolean = false;
    widgetCatalog: WidgetCatalog;
    searchWidget = '';
    filterWidgets: any = [];
    isUpdateRequired = false;
    displayListValue: any;
    column = 'title';
    reverse = false;

    constructor(private appStateService: AppStateService, private modalService: BsModalService,
        private userService: UserService, private widgetCatalogService: WidgetCatalogService,
        private alertService: AlertService, private componentService: DynamicComponentService,
        private appService: ApplicationService, private fetchClient: FetchClient, private pluginsService: PluginsService,
        private router: Router, private route: ActivatedRoute,private progressIndicatorService: ProgressIndicatorService) {
        this.userHasAdminRights = userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN", "ROLE_APPLICATION_MANAGEMENT_ADMIN"]);
        this.widgetCatalogService.displayListValue$.subscribe((value) => {
            if (value) {
                this.displayListValue = value;
            } else {
                this.displayListValue = '1';
            }
        });
    }


   async ngOnInit() {
        if (this.userHasAdminRights) {
            const ownAppBuilder = (await this.widgetCatalogService.isOwnAppBuilder());
            if(!ownAppBuilder) {
                const alertMessage = {
                    title: 'Application Builder',
                    description: `It looks like you are currently using a subscribed Application Builder in this tenant. To use the Widget Catalog, you’ll need to install an instance of the Application Builder.
                    
                    Please confirm if you wish to install the Application Builder.`,
                    type: 'warning',
                    alertType: 'confirm', //info|confirm
                    confirmPrimary: true //confirm Button is primary
                }
                const installDemoDialogRef = this.alertModalDialog(alertMessage);
                await installDemoDialogRef.content.event.subscribe(async data => {
                    if (data && data.isConfirm) {
                        this.showProgressModalDialog('Please wait...');
                        await this.widgetCatalogService.cloneAppBuilder();
                        window.location.reload();
                    } else {
                        this.router.navigateByUrl(`/home`);
                    }
                });
            }
            else if (this.widgetCatalogService.runtimeLoadingCompleted) {
                this.loadWidgetsFromCatalog();
            } else {
                this.isBusy = true;
                const waitForWidgetLoaderInt = interval(1000);
                const waitForWidgetLoaderSub = waitForWidgetLoaderInt.subscribe(async val => {
                    if (this.widgetCatalogService.runtimeLoadingCompleted) {
                        waitForWidgetLoaderSub.unsubscribe();
                        this.loadWidgetsFromCatalog();
                    }
                });
            }
        }
    }

    reload() {
        window.location.reload();
    }

    refresh() {
        window.location.reload();
    }
    private async loadWidgetsFromCatalog() {

        this.isBusy = true;
        this.appList = await this.pluginsService.listPackages();
        forkJoin([this.widgetCatalogService.fetchWidgetCatalog(), this.widgetCatalogService.fetchWidgetForDemoCatalog()])
            .subscribe(async ([widgetList1, widgetList2]) => {
                this.widgetCatalog = widgetList1;
                widgetList2.widgets.forEach((widget: WidgetModel) => {
                    const widgetObj = this.widgetCatalog.widgets.find(widgetObj => widgetObj.contextPath === widget.contextPath);
                    if (!widgetObj && this.widgetCatalogService.isCompatiblieVersion(widget)) {
                        this.widgetCatalog.widgets.push(widget);
                    }
                });
                this.appList.forEach(app => {
                    const appWidgetObj = this.widgetCatalog.widgets.find(widgetObj => widgetObj.contextPath === app.contextPath);
                    if (!appWidgetObj) {
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

                });
                await this.filterInstalledWidgets();
                this.filterWidgets = (this.widgetCatalog ? this.widgetCatalog.widgets : []);
                this.isBusy = false;
            }, error => {
                this.alertService.danger("There is some technical error! Please try after sometime.");
                this.isBusy = false;
            });
    }

    openDocumentation(url: string) {
        window.open(url);
    }

    preview(imageURL: string) {
        this.modalService.show(previewModalComponent, { class: 'modal-lg', initialState: { imageURL } });
    }

    applyFilter() {
        if (this.widgetCatalog && this.widgetCatalog.widgets.length > 0) {
            this.filterWidgets = this.widgetCatalog.widgets.filter((widget => widget.title.toLowerCase().includes(this.searchWidget.toLowerCase())));
            this.filterWidgets = [...this.filterWidgets];
        }
    }
    async updateAll() {
        const widgetCompatibility = this.widgetCatalog.widgets.find(wdgt => wdgt.actionCode === "002");
        if (widgetCompatibility) {
            const alertMessage = {
                title: 'Update Confirmation',
                description: `One or more widgets are supported by current version of application builder and may not work properly.
                Do you want to proceed?`,
                type: 'warning',
                alertType: 'confirm', //info|confirm
                confirmPrimary: false //confirm Button is primary
            }
            const installDemoDialogRef = this.alertModalDialog(alertMessage);
            await installDemoDialogRef.content.event.subscribe(async data => {
                if (data && data.isConfirm) {
                    for (const widget of this.widgetCatalog.widgets) {
                        if (!widget.isReloadRequired && this.isUpdateAvailable(widget)) {
                            await this.updateWidget(widget, true);
                        }
                    };
                }
            });
        } else {
            for (const widget of this.widgetCatalog.widgets) {
                if (!widget.isReloadRequired && this.isUpdateAvailable(widget)) {
                    await this.updateWidget(widget, true);
                }
            };
        }
    }

    async unInstallAllWidgets() {
        const alertMessage = {
            title: 'Uninstall widgets',
            description: `You are about to uninstall all widgets.
            Do you want to proceed?`,
            type: 'danger',
            alertType: 'confirm', //info|confirm
            confirmPrimary: true //confirm Button is primary
        }
        const unInstallDemoDialogRef = this.alertModalDialog(alertMessage);
        await unInstallDemoDialogRef.content.event.subscribe(async data => {
            if (data && data.isConfirm) {
                this.showProgressModalDialog(`Uninstalling widgets...`)
                this.progressIndicatorService.setProgress(10);
                let isWidgetFound = false;
                let updatedAppRemotes = null;
                 for (const widget of this.widgetCatalog.widgets) {
                    const widgetAppObj = this.appList.find(app => app.contextPath === widget.contextPath)
                    if(widgetAppObj) {
                        isWidgetFound = true;
                        updatedAppRemotes = await this.widgetCatalogService.removePlugins(widgetAppObj);
                        widget.actionCode = '003';
                    }
                };
                if(isWidgetFound) {
                    this.progressIndicatorService.setProgress(90);
                    await this.widgetCatalogService.updateAppConfigRemotes(updatedAppRemotes);
                }
                this.hideProgressModalDialog();
                this.refresh();
            }
        });
    }

    showProgressModalDialog(message: string): void {
        this.progressModal = this.modalService.show(ProgressIndicatorModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    hideProgressModalDialog(): void {
        this.progressModal.hide();
    }
    async updateWidget(widget: WidgetModel, bulkUpdate: boolean): Promise<void> {
        const currentHost = window.location.host.split(':')[0];
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
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
                    this.progressIndicatorService.setProgress(5);
                    await this.initiateUpdateWidgetProcess(widget);
                }
            });

        } else { 
            this.progressIndicatorService.setProgress(5);
            await this.initiateUpdateWidgetProcess(widget); }

    }

    private alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
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
            this.widgetCatalogService.installPackage(fileOfBlob).then(async () => {
                widget.isReloadRequired = true;
                widget.installedVersion = widget.version;
                this.actionFlag(widget);
                await new Promise(resolve => setTimeout(resolve, 5000));
                this.hideProgressModalDialog();
                resolve(true);
            });
        });
    }

    private async filterInstalledWidgets() {
        if (!this.widgetCatalog || !this.widgetCatalog.widgets
            || this.widgetCatalog.widgets.length === 0) {
            return;
        }

        const currentApp: IApplication =  (await this.widgetCatalogService.getCurrentApp());
        let installedPlugins = currentApp?.config?.remotes;
        installedPlugins = (installedPlugins ? this.widgetCatalogService.removeVersionFromPluginRemotes(installedPlugins) : []);
        for(let widget of this.widgetCatalog.widgets) {
            widget.isCompatible = this.widgetCatalogService.isCompatiblieVersion(widget);
            const appObj = this.appList.find(app => app.contextPath === widget.contextPath);
            const widgetObj = installedPlugins.find( plugin => plugin.pluginContext === widget.contextPath);
            widget.installedVersion = (widgetObj && appObj && appObj.manifest && appObj.manifest.version ? appObj.manifest.version : '');
            widget.installed = widgetObj && appObj && this.findInstalledWidget(widget); //(widgetObj != undefined);
            if (widget.installed && !widget.isReloadRequired && this.isUpdateAvailable(widget)) {
                this.isUpdateRequired = true;
            }
            this.actionFlag(widget);
        }
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

    isUpdateAvailable(widget: WidgetModel) {
        if (!widget.binaryLink && !widget.link) { return false }
        if (!widget.installedVersion && widget.installedVersion === '') {
            return true;
        }
        return this.widgetCatalogService.isLatestVersionAvailable(widget);
    }


    /**
     * compatible and update available: 001
     * non compatible and update available: 002
     * refresh: 003
     * force upgrade 004 (my widget) -TODO
     * invisible 000
     */
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
                this.progressIndicatorService.setProgress(25);
                const widgetAppObj = this.appList.find(app => app.contextPath === widget.contextPath)
                const updatedAppRemotes = await this.widgetCatalogService.removePlugins(widgetAppObj);
                this.progressIndicatorService.setProgress(90);
                await this.widgetCatalogService.updateAppConfigRemotes(updatedAppRemotes);
                this.hideProgressModalDialog();
                widget.actionCode = '003';
                
            }
        });
    }

    // Tile List View
    displayList(value) {
        this.displayListValue = value;
        this.widgetCatalogService.setDisplayListValue(value);
    }

    navigateToDetailPage(widget) {
        this.widgetCatalogService.setWidgetDetails(widget);
        this.router.navigate(['widget-details', { id: widget.contextPath }], { relativeTo: this.route });
    }
    
    sortColumn(col) {
        this.column = col;
        if (this.reverse) {
            this.filterWidgets.sort((a, b) => a[col] < b[col] ? 1 : a[col] > b[col] ? -1 : 0);
            this.reverse = false;
        } else {
            this.filterWidgets.sort((a, b) => a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0);
            this.reverse = true;
        }
    }

    sortClass(col) {
        if (this.column === col) {
            if (this.reverse) {
                return 'arrow-down';
            } else {
                return 'arrow-up';
            }
        } else {
            return '';
        }
    }
}
