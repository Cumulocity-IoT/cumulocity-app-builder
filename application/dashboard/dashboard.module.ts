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
import {InventoryService, ApplicationService} from "@c8y/client";
import {AppStateService} from "@c8y/ngx-components";
import {DashboardController} from "./dashboard.controller";

import './cumulocity.json';
import {Router} from "@angular/router";

declare const angular: any;

function urlToHashPathSegments(urlString: string): string[] {
    const url = new URL(urlString);
    const hash = url.hash;
    return hash.replace('#/', '').split('/');
}

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
    // Redirect all device/:deviceId, group/:groupId....
    // If it's device or group then try to find an appropriate application builder dashboard, otherwise link to the cockpit
    .run(['$rootScope', 'applicationService', ($rootScope, applicationService) => {
        $rootScope.$on('$locationChangeStart', async (event, next, current) => {
            const nextPathSegments = urlToHashPathSegments(next);
            const currentPathSegments = urlToHashPathSegments(current);
            if (nextPathSegments.length >= 1) {
                // device/:deviceId or group/:groupId attempt to redirect inside the Application Builder
                if (nextPathSegments.length >= 2 && ['device', 'group'].includes(nextPathSegments[0]) && currentPathSegments.length >= 2 && currentPathSegments[0] === 'application') {
                    event.preventDefault();

                    // Try to find an application builder dashboard with the device or group id
                    const appId = currentPathSegments[1];
                    const application = (await applicationService.detail(appId)).data;
                    let matchingDashboard;
                    if (application.applicationBuilder && application.applicationBuilder.dashboards) {
                        matchingDashboard = application.applicationBuilder.dashboards.find(dashboard => dashboard.deviceId === nextPathSegments[1])
                    }
                    if (matchingDashboard) {
                        window.location.hash = `/application/${appId}/dashboard/${matchingDashboard.id}/device/${matchingDashboard.deviceId}`;
                    } else {
                        window.location.assign(`/apps/cockpit/${new URL(next).hash}`);
                    }
                // Everything else redirects to the cockpit
                } else if (['device', 'group', 'users', 'applications', 'subscribedApplications', 'tenants'].includes(nextPathSegments[0])) {
                    event.preventDefault();
                    window.location.assign(`/apps/cockpit/${new URL(next).hash}`);
                }
            }
        });
    }])
    .run(['$rootScope', 'applicationService', 'ngxRouter', ($rootScope, applicationService, ngxRouter) => {
        $rootScope.$on('$locationChangeStart', async (event, next, current) => {
            // Make sure that both angular and angularjs's routers are in sync... they seem to sometimes get out of sync.... bug?
            if (next != current) {
                const nextPathSegments = urlToHashPathSegments(next);
                ngxRouter.navigate([`/${nextPathSegments.join('/')}`]);
            }
        });
    }])
    .factory('inventoryService', downgradeInjectable(InventoryService))
    .factory('applicationService', downgradeInjectable(ApplicationService))
    .factory('appStateService', downgradeInjectable(AppStateService))
    .factory('ngxRouter', downgradeInjectable(Router))
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
