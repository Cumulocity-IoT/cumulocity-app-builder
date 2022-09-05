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
import {Component, Inject, Input, OnChanges, OnInit, Renderer2, SimpleChanges} from "@angular/core";
import {InventoryService} from "@c8y/client";
import {
    ActionBarService,
    AlertService,
    DashboardChange,
    DashboardChildChange,
    GainsightService,
    ModalService
} from "@c8y/ngx-components";
import {BsModalService} from "ngx-bootstrap/modal";
import {
    CONTEXT_DASHBOARD_CONFIG,
    ContextDashboardService,
    ContextDashboardType,
    ContextDashboardComponent,
    WidgetService
} from "@c8y/ngx-components/context-dashboard";
import {ActivatedRoute, Router} from "@angular/router";
import {Subscription} from "rxjs";
import { TranslateService } from "@ngx-translate/core";
//import {ContextDashboardComponent} from "../../../dashboard-by-id/context-dashboard.component";
// import {WidgetService} from "../../../dashboard-by-id/widget.service";

/**
 * Loads a template dashboard, substituting the templateDeviceId for the current deviceId
 */
@Component({
    selector: 'group-template-dashboard',
    template: `
        <c8y-widgets-dashboard [context]="context" 
                               [contextDashboard]="dashboard"
                               [widgets]="widgets"
                               [settings]="{
                                isLoading: isLoading,
                                isFrozen: frozen,
                                isDisabled: disabled,
                                canDelete: false,
                                translateWidgetTitle: dashboard?.translateWidgetTitle,
                                allowFullscreen: true,
                                title: dashboard?.name,
                                widgetMargin: dashboard?.widgetMargin
                               }"
                               (onFreeze)="toggleFreeze($event)" 
                               (onChangeDashboard)="update_patched($event)"
                               (onAddWidget)="addWidget()" 
                               (onEditWidget)="editWidget($event)"
                               (onDeleteWidget)="deleteWidget($event)" 
                               (onChangeStart)="addDashboardClassToBody()"
                               (onChangeEnd)="removeDashboardClassFromBody()" 
                               (onEditDashboard)="editDashboard()">
        </c8y-widgets-dashboard>
    `
})
export class GroupTemplateComponent extends ContextDashboardComponent implements OnChanges, OnInit {
    @Input() dashboardId;
    @Input() deviceId;
    @Input() context: Partial<{
        id: string,
        name: string,
        type: ContextDashboardType
    }> = {}
    // Don't want to override the base implementation of disabled hence the '2'
    @Input('disabled') disabled2: boolean;

    frozen = true;

    constructor(
        route: ActivatedRoute,
        router: Router,
        contextDashboardService: ContextDashboardService,
        alert: AlertService,
        renderer: Renderer2,
        @Inject(CONTEXT_DASHBOARD_CONFIG) moduleConfig,
        widgetService: WidgetService,
        bsModal: BsModalService,
        private inventoryService: InventoryService,
        gainsightService: GainsightService,
        actionBarService: ActionBarService,
        translateService: TranslateService,
        modalService: ModalService
    ) {
        super(route, router, contextDashboardService, alert, renderer, moduleConfig, widgetService, bsModal, inventoryService, 
            gainsightService, actionBarService, translateService, modalService);
        // @ts-ignore
        this.dataSub = new Subscription();
    }

    ngOnInit() {
        // Override the base implementation so that it doesn't load a dashboard from the context or name
    }

    async ngOnChanges(changes: SimpleChanges) {
        if (changes.dashboardId || changes.deviceId) {
            this.isLoading = true;
            this.widgets = [];
            this.mo = undefined;
            this.dashboard = undefined;
            if (this.dashboardId && this.deviceId) {
                await this.loadDashboardId(this.dashboardId, this.deviceId);
            }
        }
        if (changes.disabled2) {
            this.disabled = this.disabled2;
        }
    }

    async loadDashboardId(dashboardId: string, deviceId: string) {
        const result = await this.inventoryService.detail(dashboardId);
        this.mo = result.data;
        this.dashboard = this.mo.c8y_Dashboard;
        this.dashboard.children = this.fillTemplate(this.dashboard.children, this.mo.applicationBuilder_groupTemplate.templateDeviceId, deviceId);
        // @ts-ignore
        await this.onLoad();
    }

    fillTemplate(template, oldDeviceId, newDeviceId) {
        return JSON.parse(JSON.stringify(template, undefined, 1).replace(new RegExp(`([\\\\/\\s",{}:;=()\\[\\]#\`>]|^)(${oldDeviceId})([\\\\/\\s",{}:;=()\\[\\]#\`<]|$)`, 'g'), (a,b,c,d) => (b || '') + newDeviceId + (d || '')));
    }

    // The parent class seems to have the wrong type for this argument so we change the type.... maybe it's a bug in c8y?
    update_patched($event: DashboardChange) {
        return super.updateDashboardChildren($event as any as DashboardChildChange);
    }

    async toggleFreeze() {
        await this.inventoryService.update({
            id: this.dashboardId,
            c8y_Dashboard: this.dashboard,
            applicationBuilder_groupTemplate: {
                ...this.mo.applicationBuilder_groupTemplate,
                templateDeviceId: this.deviceId
            }
        });
        this.frozen = !this.frozen;
    }
}
