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
import { previewModalComponent } from '../preview-modal/preview.-modal.component';
import { WidgetCatalog, WidgetModel } from '../widget-catalog.model';
import { WidgetCatalogService } from '../widget-catalog.service';
import { interval } from 'rxjs';
import { RuntimeWidgetLoaderService } from 'cumulocity-runtime-widget-loader';
import { contextPathFromURL } from 'builder/utils/contextPathFromURL';
import { IAppRuntimeContext } from 'cumulocity-runtime-widget-loader/runtime-widget-loader/runtime-widget-loader.service';
@Component({
    templateUrl: './my-widgets.component.html',
    styleUrls: ['./my-widgets.component.less']
})

export class MyWidgetsComponent implements OnInit, OnDestroy{

    private progressModal: BsModalRef;
    private appList = [];
    
    userHasAdminRights: boolean;
    isBusy: boolean = false;
    widgetCatalog: WidgetCatalog;
    searchWidget = '';
    filterWidgets: any = [];

    constructor( private appStateService: AppStateService, private modalService: BsModalService, 
        private userService: UserService, private widgetCatalogService: WidgetCatalogService, 
        private alertService: AlertService, private componentService: DynamicComponentService, 
        private runtimeWidgetLoaderService: RuntimeWidgetLoaderService, private appService: ApplicationService, 
        private invService: InventoryService) {
        this.userHasAdminRights = userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN","ROLE_APPLICATION_MANAGEMENT_ADMIN"]);
        this.runtimeWidgetLoaderService.isLoaded$.subscribe( isLoaded => {
            this.widgetCatalogService.runtimeLoadingCompleted = isLoaded;
        })   
    }
                        

    ngOnInit() {
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
        })
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
    updateAll() {
        console.log('widgets', this.widgetCatalog.widgets);
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

        this.showProgressModalDialog(`Updating ${widget.title}`)
        this.widgetCatalogService.downloadBinary(widget.link).subscribe(data => {
            const blob = new Blob([data], {
                type: 'application/zip'
            });
            const fileOfBlob = new File([blob], widget.fileName);
            this.widgetCatalogService.installWidget(fileOfBlob, widget).then(() => {
                widget.installed = true;
                widget.isReloadRequired = true;
                widget.installedVersion = widget.version;
                this.hideProgressModalDialog();
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
                    console.log('widget obj in subscribe', widgetObj);
                    resolve(widgetObj);
                });
            });
            widget.installed = (widgetObj != undefined);
            widget.isCompatible = this.widgetCatalogService.isCompatiblieVersion(widget);
            const appObj = this.appList.find( app => app.contextPath === widget.contextPath);
            widget.installedVersion = (appObj && appObj.manifest  && appObj.manifest.version ? appObj.manifest.version : '');
        });
        this.widgetCatalog.widgets = this.widgetCatalog.widgets.filter(widget => widget.installed);
    }

    isUpdateAvailable(widget: WidgetModel) {
        if(!widget.installedVersion && widget.installedVersion === ''){
            return true;
        }
        return this.widgetCatalogService.isLatestVersionAvailable(widget);
    }

    ngOnDestroy() {
    }
}
