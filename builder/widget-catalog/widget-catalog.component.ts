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
    IApplication,
    UserService
} from "@c8y/client";
import { AlertService, AppStateService, DynamicComponentService } from "@c8y/ngx-components";
import { ProgressIndicatorModalComponent } from '../utils/progress-indicator-modal/progress-indicator-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { interval, Subscription } from 'rxjs';
import { previewModalComponent } from './preview-modal/preview-modal.component';
import { WidgetCatalog, WidgetModel } from './widget-catalog.model';
import { WidgetCatalogService } from './widget-catalog.service';
import { RuntimeWidgetLoaderService } from 'cumulocity-runtime-widget-loader';
import { AlertMessageModalComponent } from "../utils/alert-message-modal/alert-message-modal.component";
import { catchError } from "rxjs/operators";
import { Router, ActivatedRoute } from "@angular/router";
import { ProgressIndicatorService } from "../utils/progress-indicator-modal/progress-indicator.service";

@Component({
    templateUrl: './widget-catalog.component.html',
    styleUrls: ['./widget-catalog.component.less']
})


export class WidgetCatalogComponent implements OnInit, OnDestroy {

    private progressModal: BsModalRef;
    private appList = [];

    userHasAdminRights: boolean;
    isBusy: boolean = false;
    widgetCatalog: WidgetCatalog;
    searchWidget = '';
    filterWidgets: any = [];
    selectMultipe = false;
    showAllWidgets = false;
    column = 'title';
    reverse = false;

    displayListValue: any;
    constructor(private appStateService: AppStateService, private modalService: BsModalService,
        private userService: UserService, private widgetCatalogService: WidgetCatalogService,
        private alertService: AlertService, private componentService: DynamicComponentService, private appService: ApplicationService,
        private runtimeWidgetLoaderService: RuntimeWidgetLoaderService,
        private router: Router, private route: ActivatedRoute,
        private progressIndicatorService: ProgressIndicatorService) {
        this.userHasAdminRights = userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN", "ROLE_APPLICATION_MANAGEMENT_ADMIN"]);

        this.widgetCatalogService.displayListValueMoreWidgets$.subscribe((value) => {
            if (value) {
                this.displayListValue = value;
            } else {
                this.displayListValue = '1';
            }
        });
    }


    async ngOnInit() {
        if (this.widgetCatalogService.runtimeLoadingCompleted) {
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

    reload() {
        window.location.reload();
    }

    refresh() {
        window.location.reload();
    }
    private async loadWidgetsFromCatalog() {

        this.isBusy = true;
        this.appList = (await this.appService.list({ pageSize: 2000 })).data;
        await this.widgetCatalogService.fetchWidgetCatalog()
            .subscribe(async (widgetCatalog: WidgetCatalog) => {
                this.widgetCatalog = widgetCatalog;
                await this.filterInstalledWidgets();
                this.applyFilter();
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
        this.filterWidgets = [];
        if (this.widgetCatalog && this.widgetCatalog.widgets.length > 0) {
            if (!this.showAllWidgets) {
                this.filterWidgets = this.widgetCatalog.widgets.filter((widget => widget.title.toLowerCase().includes(this.searchWidget.toLowerCase()) && widget.isCompatible));
            } else {
                this.filterWidgets = this.widgetCatalog.widgets.filter((widget => widget.title.toLowerCase().includes(this.searchWidget.toLowerCase())));
            }
            this.filterWidgets = [...this.filterWidgets];
        }

    }

    showProgressModalDialog(message: string): void {
        this.progressModal = this.modalService.show(ProgressIndicatorModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    hideProgressModalDialog(): void {
        this.progressModal.hide();
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

    private alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    private async initiateInstallWidgetProcess(widget: WidgetModel, widgetBinary: any) {
        this.showProgressModalDialog(`Installing ${widget.title}`)
        this.progressIndicatorService.setProgress(10);
        if(widgetBinary) {
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
                }, error => {
                    this.alertService.danger("There is some technical error! Please try after sometime.");
                    console.error(error);
                });
            });
        } 
        
    }

    // TODO: For phase II of widget catalog
    /* async installMultiple() {
        const selectedWidgets = this.filterWidgets.filter( (widget: WidgetModel) => widget.selected);
    } */
    private async filterInstalledWidgets() {
        if (!this.widgetCatalog || !this.widgetCatalog.widgets
            || this.widgetCatalog.widgets.length === 0) {
            return;
        }

        const currentApp: IApplication =  (await this.widgetCatalogService.getCurrentApp());
        const installedPlugins = currentApp?.manifest?.remotes;
        for(let widget of this.widgetCatalog.widgets) {
            const widgetObj = (installedPlugins  && installedPlugins[widget.contextPath] && installedPlugins[widget.contextPath].length> 0);
            widget.installed = (widgetObj != undefined && widgetObj);
            widget.isCompatible = this.widgetCatalogService.isCompatiblieVersion(widget);
            this.actionFlag(widget);
        }
       
        this.widgetCatalog.widgets = this.widgetCatalog.widgets.filter(widget => !widget.installed);
    }

    toggleCompatible() {
        //   this.onlyCompatibleWidgets = !this.onlyCompatibleWidgets
        this.applyFilter();
    }

    /**
     * compatible: 001
     * non compatible: 002
     * refresh: 003
     * force upgrade 004 (my widget)
     * invisible 000
     */
    private actionFlag(widget: WidgetModel) {

        if (this.userHasAdminRights) {
            if (widget.isCompatible && !widget.installed) { widget.actionCode = '001'; }
            else if (!widget.isCompatible && !widget.installed) { widget.actionCode = '002'; }
            else if (widget.isReloadRequired && widget.installed) { widget.actionCode = '003'; }
            else { widget.actionCode = '000'; }
        } else {
            widget.actionCode = '000';
        }
    }

    ngOnDestroy() {
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
    // Tile List View
    displayList(value) {
        this.displayListValue = value;
        this.widgetCatalogService.setDisplayListValueMoreWidgets(value);
    }

    navigateToDetailPage(widget) {
        this.widgetCatalogService.setWidgetDetails(widget);
        this.router.navigate(['widget-details', { id: widget.contextPath }], { relativeTo: this.route });
    }
}
