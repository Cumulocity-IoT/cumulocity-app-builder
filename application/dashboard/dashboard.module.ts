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
import {downgradeInjectable} from "@angular/upgrade/static";
import {InventoryService} from "@c8y/client";
import {AppStateService} from "@c8y/ngx-components";
import {DashboardController} from "./dashboard.controller";

import './cumulocity.json';

declare const angular: any;

angular
    .module('framework', [])
    .config(['c8yViewsProvider', c8yViewsProvider => {
        const paths = [
            'application/:applicationId/dashboard/:frameworkDashboardId',
            'application/:applicationId/dashboard/:frameworkDashboardId/device/:deviceId'
        ];
        paths.forEach((path) => {
            c8yViewsProvider.when(path, {
                priority: 1000,
                name: "Dashboard",
                icon: "th",
                template: '<framework-dashboard/>'
            });
        });
    }])
    // Redirect all device/:deviceId, group/:groupId.... back to the cockpit
    .run(['$rootScope', $rootScope => {
        $rootScope.$on('$locationChangeStart', (event, next, current) => {
            const url = new URL(next);
            const hash = url.hash;
            const pathSegments = hash.replace('#/', '').split('/');
            if (pathSegments.length >= 1) {
                if (['device', 'group', 'users', 'applications', 'subscribedApplications', 'tenants'].includes(pathSegments[0])) {
                    event.preventDefault();
                    window.location.assign(`/apps/cockpit/${hash}`);
                }
            }
        });
    }])
    .factory('inventoryService', downgradeInjectable(InventoryService))
    .factory('appStateService', downgradeInjectable(AppStateService));

angular
    .module('framework')
    .component('frameworkDashboard', {
        template: `<c8y-dashboard-gridstack id="vm.dashboardId" is-frozen="false"/>`,
        controllerAs: 'vm',
        controller: [
            '$routeParams',
            'c8yTitle',
            'inventoryService',
            'appStateService',
            DashboardController
        ]
    });

@NgModule({})
export class DashboardModule {}