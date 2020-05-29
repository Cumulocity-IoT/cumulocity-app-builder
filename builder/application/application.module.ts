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
import {Injectable, NgModule} from "@angular/core";
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Resolve,
    Router,
    RouterModule,
    RouterStateSnapshot,
    UrlTree
} from "@angular/router";
import {
    AppBuilderContextDashboardComponent
} from "./app-builder-context-dashboard.component";
import {DashboardByIdModule} from "../../dashboard-by-id/dashboard-by-id.module";
import {CoreModule} from "@c8y/ngx-components";
import {AppBuilderSmartRulesComponent} from "./app-builder-smart-rules.component";
import {LegacyDataExplorerComponent} from "./dataexplorer/legacy-data-explorer.component";
import {LegacySmartRulesComponent} from "./smartrules/legacy-smart-rules.component";
import {LegacyAlarmsComponent} from "./alarms/legacy-alarms.component";
import {smartRulesAvailabilityProvider} from "./smartrules/smart-rules-availability.upgraded-provider";
import {ApplicationService, InventoryService} from "@c8y/client";
import {IApplicationBuilderApplication} from "../iapplication-builder-application";

@Injectable({
    providedIn: 'root',
})
export class DeviceContextResolverService implements Resolve<string> {
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): string {
        let deviceId = route.paramMap.get('deviceId');
        if (deviceId) {
            return "device";
        } else {
            return undefined;
        }
    }
}

@Injectable({
    providedIn: 'root',
})
export class DeviceContextDataResolverService implements Resolve<{context: string, id: string}> {
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): {context: string, id: string} {
        let deviceId = route.paramMap.get('deviceId');
        if (deviceId) {
            return {
                context: "device",
                id: deviceId
            }
        } else {
            return undefined;
        }
    }
}

@Injectable({ providedIn: 'root' })
export class RedirectToFirstDashboardOrConfig implements CanActivate {
    constructor(private appService: ApplicationService, private router: Router, private inventoryService: InventoryService) {}

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
        const appId = route.paramMap.get('applicationId');
        const application = (await this.appService.detail(appId)).data as IApplicationBuilderApplication;
        if (application && application.applicationBuilder) {
            if (application.applicationBuilder.dashboards && application.applicationBuilder.dashboards.length > 0) {
                console.debug('Redirecting to first dashboard');
                const firstDashboard = application.applicationBuilder.dashboards[0];
                let url = `/application/${appId}`;
                if (firstDashboard.tabGroup) {
                    url += `/tabgroup/${firstDashboard.tabGroup}`
                }
                url += `/dashboard/${firstDashboard.id}`
                if (firstDashboard.deviceId) {
                    if (firstDashboard.groupTemplate) {
                        const childAssets = (await this.inventoryService.childAssetsList(firstDashboard.deviceId, {pageSize: 2000, query: 'has(c8y_IsDevice)'})).data;
                        if (childAssets.length > 0) {
                            url += `/device/${childAssets[0].id}`
                        } else {
                            console.debug('First dashboard was groupTemplate but no devices available, redirecting to config');
                            return this.router.parseUrl(`/application/${appId}/config`);
                        }
                    } else {
                        url += `/device/${firstDashboard.deviceId}`
                    }
                }
                return this.router.parseUrl(url);
            } else {
                console.debug('No dashboards available, redirecting to config');
                return this.router.parseUrl(`/application/${appId}/config`);
            }
        } else {
            console.error(`Application ${appId} isn't an application-builder application`);
            return this.router.parseUrl('');
        }
    }
}

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: 'application/:applicationId',
                canActivate: [RedirectToFirstDashboardOrConfig],
                children: []
            },
            ...[
                'application/:applicationId/tabgroup/:tabGroup/dashboard/:dashboardId/device/:deviceId',
                'application/:applicationId/tabgroup/:tabGroup/device/:deviceId/:deviceDetail',
                'application/:applicationId/tabgroup/:tabGroup/dashboard/:dashboardId',
                'application/:applicationId/dashboard/:dashboardId/device/:deviceId',
                'application/:applicationId/dashboard/:dashboardId/device/:deviceId/:deviceDetail',
                'application/:applicationId/dashboard/:dashboardId'
            ].map(path => ({
                path,
                resolve: {
                    context: DeviceContextResolverService,
                    contextData: DeviceContextDataResolverService
                },
                component: AppBuilderContextDashboardComponent
            }))
        ]),
        DashboardByIdModule,
        CoreModule
    ],
    declarations: [
        AppBuilderContextDashboardComponent,
        AppBuilderSmartRulesComponent,
        LegacyDataExplorerComponent,
        LegacySmartRulesComponent,
        LegacyAlarmsComponent,
    ],
    providers: [
        smartRulesAvailabilityProvider
    ]
})
export class ApplicationModule {}
