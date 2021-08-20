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
    UserService
} from "@c8y/client";
import {AlertService, AppStateService, DynamicComponentService} from "@c8y/ngx-components";
import { ProgressIndicatorModalComponent } from '../utils/progress-indicator-modal/progress-indicator-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { previewModalComponent } from './preview-modal/preview.-modal.component';
import { WidgetCatalog, WidgetModel } from './widget-catalog.model';
import { WidgetCatalogService } from './widget-catalog.service';
import * as semver from "semver";

@Component({
    templateUrl: './widget-catalog.component.html',
    styleUrls: ['./widget-catalog.component.less']
})

// Custom property settings for Application Builder
export class WidgetCatalogComponent implements OnInit, OnDestroy{

    private progressModal: BsModalRef;
    
    userHasAdminRights: boolean;
    isBusy: boolean = false;
    widgetCatalog: WidgetCatalog;
    searchWidget = '';
    filterWidgets: any = [];
    selectMultipe = false;
    constructor( private appStateService: AppStateService, private modalService: BsModalService, 
        private userService: UserService, private widgetCatalogService: WidgetCatalogService, 
        private alertService: AlertService, private componentService: DynamicComponentService) {
        this.userHasAdminRights = userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN","ROLE_APPLICATION_MANAGEMENT_ADMIN"]);
    }
                        

    ngOnInit() {
        this.loadWidgetsFromCatalog();
    }

    reload() {
        this.filterWidgets = [];
        this.loadWidgetsFromCatalog();
    }

    refresh() {
        window.location.reload();
    }
    private async loadWidgetsFromCatalog() {

        this.isBusy = true;
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

    private isCompatiblieVersion(widget: WidgetModel) {
        console.log("widgetId", widget.id);
        const isValidVersion = semver.satisfies('1010.0.8', widget.requiredPlatformVersion);
        widget.isCompatible = isValidVersion;
        console.log("isValidVersion", isValidVersion);
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
            this.alertService.warning("Runtime widget installation isn't supported when running Application Builder on localhost.");
            return;
        }
        
        this.showProgressModalDialog(`Install ${widget.title}`)
        this.widgetCatalogService.downloadBinary(widget.link).subscribe(data => {
            const blob = new Blob([data], {
                type: 'application/zip'
            });

            this.widgetCatalogService.installWidget(blob).then(() => {
                widget.installed = true;
                widget.isReloadRequired = true;
                this.hideProgressModalDialog();
            });
        });
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

        await this.widgetCatalog.widgets.forEach(async widget => {
            const widgetObj = await new Promise<any>((resolve) => {
                this.componentService.getById$(widget.id).subscribe(widgetObj => {
                    console.log('widget obj in subscribe', widgetObj);
                    resolve(widgetObj);
                });
            });
            widget.installed = (widgetObj != undefined);
            this.isCompatiblieVersion(widget);
            /* if(widget.id === 'smart-map-widget' || widget.id === 'smart-map-settings') {
              //  widget.installed = true;
            } else {
                widget.installed = true;
                widget.isReloadRequired = true;
            } */
        });
        this.widgetCatalog.widgets = this.widgetCatalog.widgets.filter(widget => !widget.installed);
    }

    private async getInstalledWidgetList() {
        // Find the current app so that we can pull a list of installed widgets from it
       /*  const appList = (await this.appService.list({pageSize: 2000})).data;
        
        // Updated to check for own app builder first
        let app: IApplication & {widgetContextPaths?: string[]} | undefined = appList.find(app => app.contextPath === contextPathFromURL() &&
        app.availability === 'PRIVATE') ;
        if (!app) {
            // Own App builder not found. Looking for subscribed one
            app = appList.find(app => app.contextPath === contextPathFromURL());
            if(!app) { throw Error('Could not find current application.');}
        } 
        const AppRuntimePathList = (await this.invService.list( {pageSize: 2000, query: `type eq app_runtimeContext`})).data;
        const AppRuntimePath: IAppRuntimeContext & {widgetContextPaths?: string[]} = AppRuntimePathList.find(path => path.appId === app.id);
        
        const contextPaths = Array.from(new Set([
            ...(app && app.widgetContextPaths) || [],
            ...(AppRuntimePath && AppRuntimePath.widgetContextPaths) || []
        ])); */
    }
    ngOnDestroy() {
    }
}
