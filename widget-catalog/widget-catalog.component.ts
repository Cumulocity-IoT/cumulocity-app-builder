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
import {AppStateService} from "@c8y/ngx-components";
import { BsModalService } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { previewModalComponent } from './preview-modal/preview.-modal.component';
import { WidgetCatalog, WidgetModel } from './widget-catalog.model';
import { WidgetCatalogService } from './widget-catalog.service';

@Component({
    templateUrl: './widget-catalog.component.html',
    styleUrls: ['./widget-catalog.component.less']
})

// Custom property settings for Application Builder
export class WidgetCatalogComponent implements OnInit, OnDestroy{

    userHasAdminRights: boolean;
    isBusy: boolean = false;
    widgetCatalog: WidgetCatalog;
    searchWidget = '';
    filterWidgets: any = [];
    constructor( private appStateService: AppStateService, private modalService: BsModalService, 
        private userService: UserService, private widgetCatalogService: WidgetCatalogService) {
        this.userHasAdminRights = userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN","ROLE_APPLICATION_MANAGEMENT_ADMIN"]);
    }
                        

    async ngOnInit() {
        this.isBusy = true;
        this.loadWidgetsFromCatalog();
    }

    private loadWidgetsFromCatalog() {

        this.widgetCatalogService.fetchWidgetCatalog().subscribe((widgetCatalog: WidgetCatalog) => {
            this.widgetCatalog = widgetCatalog;
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
    save() {
        console.log('widgets', this.widgetCatalog.widgets);
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
