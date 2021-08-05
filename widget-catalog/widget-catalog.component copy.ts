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
import { Subscription } from 'rxjs';
import { WidgetCatalog } from './widget-catalog.model';
import { WidgetCatalogService } from './widget-catalog.service';

@Component({
    template: `
    <c8y-title>Widget Catalog</c8y-title>
    <c8y-action-bar-item [placement]="'right'">
    <button class="btn btn-link" (click)="save()">
        <i c8yIcon="cloud-upload"></i> Install widgets
    </button>
    </c8y-action-bar-item>
    <div class="card-group interact-grid" *ngIf="!isBusy">
        <div class="col-xs-12 col-sm-4 col-md-3 col-lg-3" *ngFor="let widget of widgetCatalog.widgets">
            <div class="card ">
                <div class="card-block text-center" style="margin-bottom: 5px;">
                    <h1 style="margin: 15px 0 10px; font-size: 42px;"><i [c8yIcon]="widget.icon"></i></h1>
                    <p style="word-wrap: break-word;" class="e2e-appCardName">
                    {{widget.title}}</p>
                </div>
                <div class="card-block p-t-0 p-b-0 no-min-height text-center card-column-70">
                    <div class="card-hidden-list p-b-12">
                        <p class="text-truncate" title="{{widget.version}}">
                        <a *ngIf="widget.repository" class="clickable" id="OpenApp-{{widget.id}}" title="Documentation">
                        <i c8yIcon="external-link" (click)="openDocumentation(widget.repository)" ></i> 
                        </a>
                        <small class="text-muted" >{{widget.version}} (1.0.0)</small>
                        </p>
                        <p class="text-truncate" title="{{widget.license}}">
                        <small class="text-muted" >{{widget.license}}</small>
                        </p>
                    </div>
                    <em class="small card-column-40 text-truncate" *ngIf="widget.author" title="{{widget.author}}">
                    <small class="text-muted" >{{widget.author}}</small>
                    </em>
                </div>
                <div class="card-actions-group">
                    <button
                    type="button"
                    class="btn"
                    [(ngModel)]="widget.selected"
                    btnCheckbox
                    btnCheckboxTrue="1"
                    btnCheckboxFalse="0"
                >
                    <i class="status warning" c8yIcon="cloud-upload" ></i>
                    Install
                    </button>
                    
                </div>
            </div>
        </div>
    </div>
    `
})

// Custom property settings for Application Builder
export class WidgetCatalogComponent implements OnInit, OnDestroy{

    userHasAdminRights: boolean;
    isBusy: boolean = false;
    widgetCatalog: WidgetCatalog;

    constructor( private appStateService: AppStateService,
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
            this.isBusy = false;
        })
    }
   
    openDocumentation(url: string) {
        window.open(url);
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
