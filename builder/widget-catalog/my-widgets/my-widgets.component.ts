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

import {Component, OnDestroy, OnInit} from "@angular/core";
import {
    ApplicationService,
    UserService,
    IApplication,
    InventoryService
} from "@c8y/client";
import {AlertService, AppStateService, DynamicComponentService} from "@c8y/ngx-components";
import { ProgressIndicatorModalComponent } from '../../utils/progress-indicator-modal/progress-indicator-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { previewModalComponent } from '../preview-modal/preview-modal.component';
import { WidgetCatalog, WidgetModel } from '../widget-catalog.model';
import { WidgetCatalogService } from '../widget-catalog.service';
import { interval } from 'rxjs';
import { RuntimeWidgetLoaderService } from 'cumulocity-runtime-widget-loader';
import { AlertMessageModalComponent } from "../../utils/alert-message-modal/alert-message-modal.component";
@Component({
    templateUrl: './my-widgets.component.html',
    styleUrls: ['./my-widgets.component.less']
})

export class MyWidgetsComponent implements OnInit{

    private progressModal: BsModalRef;
    private appList = [];
    
    userHasAdminRights: boolean;
    isBusy: boolean = false;
    widgetCatalog: WidgetCatalog;
    searchWidget = '';
    filterWidgets: any = [];
    isUpdateRequired = false;

    constructor( private appStateService: AppStateService, private modalService: BsModalService, 
        private userService: UserService, private widgetCatalogService: WidgetCatalogService, 
        private alertService: AlertService, private componentService: DynamicComponentService, 
        private runtimeWidgetLoaderService: RuntimeWidgetLoaderService, private appService: ApplicationService) {
        this.userHasAdminRights = userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN","ROLE_APPLICATION_MANAGEMENT_ADMIN"]);
        this.runtimeWidgetLoaderService.isLoaded$.subscribe( isLoaded => {
            this.widgetCatalogService.runtimeLoadingCompleted = isLoaded;
        })   
    }
                        

    ngOnInit() {
        if(this.userHasAdminRights){
            if(this.widgetCatalogService.runtimeLoadingCompleted) {
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
        /* this.filterWidgets = [];
        this.loadWidgetsFromCatalog(); */
        window.location.reload();
    }

    refresh() {
        window.location.reload();
    }
    private async loadWidgetsFromCatalog() {

        this.isBusy = true;
        this.appList = (await this.appService.list({pageSize: 2000})).data;
        await this.widgetCatalogService.fetchWidgetCatalog().subscribe(async (widgetCatalog: WidgetCatalog) => {
            this.widgetCatalog = widgetCatalog;
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
        this.modalService.show(previewModalComponent, { class: 'modal-lg' , initialState: {imageURL} });
    }

    applyFilter() {
        if(this.widgetCatalog && this.widgetCatalog.widgets.length > 0) {
            this.filterWidgets = this.widgetCatalog.widgets.filter((widget => widget.title.toLowerCase().includes(this.searchWidget.toLowerCase())));
            this.filterWidgets = [...this.filterWidgets];
        } 
    }
    async updateAll() {
        for (const widget of this.widgetCatalog.widgets){
            if(!widget.isReloadRequired && this.isUpdateAvailable(widget)) {
                await this.updateWidget(widget);
            }
        };
    }

    showProgressModalDialog(message: string): void {
        this.progressModal = this.modalService.show(ProgressIndicatorModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    hideProgressModalDialog(): void {
        this.progressModal.hide();
    }
    async updateWidget(widget: WidgetModel): Promise<void> {
        const currentHost = window.location.host.split(':')[0];
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            this.alertService.warning("Runtime widget installation isn't supported when running Application Builder on localhost.");
            return;
        }

        if(widget.actionCode === '002') {
            const alertMessage = {
                title: 'Update Confirmation',
                description: `${widget.title} is not supported by current version of application builder and may not work properly.
                Click on confirm if you would like to proceed further.`,
                type: 'warning',
                alertType: 'confirm' //info|confirm
              }
              const installDemoDialogRef = this.alertModalDialog(alertMessage);
              await installDemoDialogRef.content.event.subscribe(async data => {
                if(data && data.isConfirm) {
                    await this.initiateUpdateWidgetProcess(widget);
                }
              });

        } else { await this.initiateUpdateWidgetProcess(widget);}
        
    }

    private alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }
    private async initiateUpdateWidgetProcess(widget: WidgetModel) {
        this.showProgressModalDialog(`Updating ${widget.title}`)
        const blob = await new Promise<any>((resolve) => {
            this.widgetCatalogService.downloadBinary(widget.binaryLink).subscribe(data => {
                const blob = new Blob([data], {
                    type: 'application/zip'
                });
                resolve(blob);
            });
        });
        const fileOfBlob = new File([blob], widget.fileName);
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

    private async filterInstalledWidgets() {
        if (!this.widgetCatalog || !this.widgetCatalog.widgets 
            || this.widgetCatalog.widgets.length === 0) {
            return;
        }

        await this.widgetCatalog.widgets.forEach(async widget => {
            const widgetObj = await new Promise<any>((resolve) => {
                this.componentService.getById$(widget.id).subscribe(widgetObj => {
                    resolve(widgetObj);
                });
            });
            widget.installed = (widgetObj != undefined);
            widget.isCompatible = this.widgetCatalogService.isCompatiblieVersion(widget);
            const appObj = this.appList.find( app => app.contextPath === widget.contextPath);
            widget.installedVersion = (appObj && appObj.manifest  && appObj.manifest.version ? appObj.manifest.version : '');
            if(widget.installed && !widget.isReloadRequired && this.isUpdateAvailable(widget) ) {
               this.isUpdateRequired = true;
            }
            this.actionFlag(widget);
        });
        this.widgetCatalog.widgets = this.widgetCatalog.widgets.filter(widget => widget.installed);
    }

    isUpdateAvailable(widget: WidgetModel) {
        if(!widget.installedVersion && widget.installedVersion === ''){
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
    
        if(this.userHasAdminRights) {
         if(widget.isCompatible && this.isUpdateAvailable(widget) && !widget.isReloadRequired) { widget.actionCode = '001'; }
         else if(!widget.isCompatible && this.isUpdateAvailable(widget) && !widget.isReloadRequired) { widget.actionCode = '002'; }
         else if(widget.isReloadRequired && !this.isUpdateAvailable(widget)) { widget.actionCode = '003'; }
         else { widget.actionCode = '000'; }
        } else {
         widget.actionCode = '000'; 
        }
     }

}
