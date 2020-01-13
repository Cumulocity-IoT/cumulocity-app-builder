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
import {InventoryService} from "@c8y/client";
import {AppStateService} from "@c8y/ngx-components";

export class DashboardController {
    dashboardId: string;

    constructor($routeParams, c8yTitle, inventoryService: InventoryService, appStateService: AppStateService) {
        this.dashboardId = $routeParams.frameworkDashboardId;

        // Wait for the user to log in before sending the first request
        appStateService.currentUser
            .pipe(
                filter(user => user != null),
                first(),
                switchMap(() => from(inventoryService.detail(this.dashboardId).then(result => result.data)))
            )
            .subscribe(dashboard => {
                c8yTitle.changeTitle({
                    title: dashboard.c8y_Dashboard.name.split('/').reduce((acc, val) => val)
                });
            });
    }
}