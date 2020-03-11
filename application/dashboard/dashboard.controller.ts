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

import {filter, first, switchMap} from "rxjs/operators";
import {from} from "rxjs";
import {InventoryService, IManagedObject} from "@c8y/client";
import {AppStateService} from "@c8y/ngx-components";

export class DashboardController {
    dashboard: IManagedObject;

    dashboardId: string;
    predefinedReadonly: boolean;
    defaultChildren: any;
    isGroupTemplate: boolean;

    constructor(private $scope, private $cacheFactory, private $routeParams, c8yTitle, private inventoryService: InventoryService, appStateService: AppStateService) {
        const dashboardId = $routeParams.frameworkDashboardId;

        // Wait for the user to log in before sending the first request
        appStateService.currentUser
            .pipe(
                filter(user => user != null),
                first(),
                switchMap(() => from(inventoryService.detail(dashboardId).then(result => result.data)))
            )
            .subscribe(async dashboard => {
                this.dashboard = dashboard;
                if (dashboard.applicationBuilder_groupTemplate) {
                    this.isGroupTemplate = true;
                    const deviceId = $routeParams.deviceId;
                    this.defaultChildren = this.fillTemplate(dashboard.c8y_Dashboard.children, dashboard.applicationBuilder_groupTemplate.templateDeviceId, deviceId);
                    this.predefinedReadonly = true;
                    $scope.$$childHead.isInMemory = true;
                } else {
                    this.isGroupTemplate = false;
                    this.defaultChildren = undefined;
                    this.predefinedReadonly = false;
                    this.dashboardId = dashboardId;
                    $scope.$$childHead.isInMemory = false;
                }

                c8yTitle.changeTitle({
                    title: dashboard.c8y_Dashboard.name.split('/').reduce((acc, val) => val)
                });
            });
    }

    fillTemplate(template, oldDeviceId, newDeviceId) {
        return JSON.parse(JSON.stringify(template, undefined, 1).replace(new RegExp(`([\\\\/\\s",{}:;=()\\[\\]#\`>]|^)(${oldDeviceId})([\\\\/\\s",{}:;=()\\[\\]#\`<]|$)`, 'g'), (a,b,c,d) => (b || '') + newDeviceId + (d || '')));
    }

    async editGroupTemplate() {
        const deviceId = this.$routeParams.deviceId;

        await this.inventoryService.update({
            id: this.dashboard.id,
            c8y_Dashboard: {
                ...this.dashboard.c8y_Dashboard,
                children: this.fillTemplate(this.dashboard.c8y_Dashboard.children, this.dashboard.applicationBuilder_groupTemplate.templateDeviceId, deviceId),
                isFrozen: false
            },
            applicationBuilder_groupTemplate: {
                ...this.dashboard.applicationBuilder_groupTemplate,
                templateDeviceId: deviceId
            }
        });

        this.isGroupTemplate = false;
        this.defaultChildren = undefined;
        this.predefinedReadonly = false;
        this.$scope.$$childHead.isInMemory = false;

        this.$cacheFactory.get('dashboards').remove(this.dashboard.id);
        this.dashboardId = this.dashboard.id;
    }
}
