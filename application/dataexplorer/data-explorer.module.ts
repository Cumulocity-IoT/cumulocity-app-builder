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

import {NgModule} from "@angular/core";

declare const angular: any;

import './cumulocity.json';

angular.module("c8y.cockpit.dataPointExplorerUI", ["c8y.cockpit.dataPointExplorer"])
    .config(["c8yViewsProvider", "gettext", (c8yViewsProvider, gettext) => {
        [
            "application/:applicationId/tabgroup/:tabGroup/dashboard/:frameworkDashboardId/device/:deviceId/dataexplorer",
            "application/:applicationId/dashboard/:frameworkDashboardId/device/:deviceId/dataexplorer"
        ].forEach(urlPattern => {
            c8yViewsProvider.when(urlPattern, {
                icon: "bar-chart",
                name: gettext("Data explorer"),
                priority: 1,
                templateUrl: "./data-explorer.html",
                controller: ['c8yTitle', c8yTitle => {
                    c8yTitle.changeTitle({
                        title: gettext('Data Explorer')
                    });
                }]
            });
        });
    }]);

@NgModule({})
export class DataExplorerModule {}
