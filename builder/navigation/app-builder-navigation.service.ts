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

import {Injectable} from "@angular/core";
import {NavigatorNode, NavigatorNodeFactory} from "@c8y/ngx-components";
import {BehaviorSubject, combineLatest, from, of} from "rxjs";
import {mergeMap, map, startWith, switchMap, tap} from "rxjs/operators";
import {InventoryService} from "@c8y/client";
import {AppIdService} from "../app-id.service";
import {DashboardConfig} from "../application-config/dashboard-config.component";
import { AccessRightsService } from "./../../builder/access-rights.service";
import { AppDataService } from "./../../builder/app-data.service";

/**
 * Constructs the navigation menu items from an app's dashboard list
 */
@Injectable()
export class AppBuilderNavigationService implements NavigatorNodeFactory {
    nodes = new BehaviorSubject<NavigatorNode[]>([]);

    private refreshSubject = new BehaviorSubject<void>(undefined);

    constructor(private appIdService: AppIdService, private appDataService: AppDataService,
        private accessRightsService: AccessRightsService, private inventoryService: InventoryService) {
        // Listen for appId changes or to forced refreshes and then update the navigation menu
        combineLatest([appIdService.appIdDelayedUntilAfterLogin$, this.refreshSubject]).pipe(
            map(([appId]) => appId),
            switchMap(appId => {
                if (appId) {
                    return from(this.appDataService.getAppDetails(appId))
                        .pipe(
                            map(application => application.applicationBuilder.dashboards),
                            mergeMap(dashboards => from(this.dashboardsToNavNodes(appId, dashboards)))
                        );
                } else {
                    return of([]);
                }
            }),
            startWith([])
        )
        // Not sure why I have to use an intermediate behavior subject... seems like a c8y bug?
        .subscribe(this.nodes);
    }

    refresh() {
        this.refreshSubject.next(undefined);
    }

    get() {
        return this.nodes;
    }

    async dashboardsToNavNodes(appId: string, dashboards: DashboardConfig[]): Promise<NavigatorNode[]> {
        const hierarchy =  {children: {}, node: new NavigatorNode({})};
        for(const [i, dashboard] of dashboards.map((d, i) => [i, d] as [number, DashboardConfig])) {
            if (['no-nav', 'hidden'].includes(dashboard.visibility)) {
                continue;
            }
            if(!this.accessRightsService.userHasAccess(dashboard.roles)) {
                continue;
            }
            const path = dashboard.name.split('/').filter(pathSegment => pathSegment != '');
            const currentHierarchyNode = path.reduce((parent, segment, j) => {
                if (!parent.children[segment] || (j == path.length - 1 && !dashboard.groupTemplate)) {
                    const navNode = new NavigatorNode({
                        label: segment,
                        icon: 'c8y-group',
                        priority: dashboards.length - i + 1000
                    });
                    parent.node.add(navNode);
                    parent.children[segment] = {
                        children: {},
                        node: navNode
                    };
                }
                return parent.children[segment];
            }, hierarchy);

            if (dashboard.groupTemplate) {
                const childAssets = await this.inventoryService.childAssetsList(dashboard.deviceId, {pageSize: 2000, query: 'hasany(c8y_IsDevice,c8y_IsAsset)'})
                .catch(error => {console.error('error in group search',error) }) as any;
                if (childAssets && childAssets.data) {
                    for (const device of childAssets?.data) {
                        const nodeName = device.name || device.id;
                        const navNode = new NavigatorNode({
                            label: nodeName,
                            icon: dashboard.icon,
                            priority: dashboards.length - i + 1000,
                        });
                        if (dashboard.tabGroup) {
                            navNode.path = `/application/${appId}/tabgroup/${device.id}/dashboard/${dashboard.id}/device/${device.id}`;
                        } else {
                            navNode.path = `/application/${appId}/dashboard/${dashboard.id}/device/${device.id}`;
                        }
                        currentHierarchyNode.node.add(navNode);
                        currentHierarchyNode.children[nodeName] = {
                            children: {},
                            node: navNode
                        };
                    }
                    currentHierarchyNode.node.icon = 'c8y-group';
                }
            } else if (dashboard.deviceId) {
                if (dashboard.tabGroup) {
                    currentHierarchyNode.node.path = `/application/${appId}/tabgroup/${dashboard.tabGroup}/dashboard/${dashboard.id}/device/${dashboard.deviceId}`;
                } else {
                    currentHierarchyNode.node.path = `/application/${appId}/dashboard/${dashboard.id}/device/${dashboard.deviceId}`;
                }
                currentHierarchyNode.node.icon = dashboard.icon;
            } else {
                if (dashboard.tabGroup) {
                    currentHierarchyNode.node.path = `/application/${appId}/tabgroup/${dashboard.tabGroup}/dashboard/${dashboard.id}`;
                } else {
                    currentHierarchyNode.node.path = `/application/${appId}/dashboard/${dashboard.id}`;
                }
                currentHierarchyNode.node.icon = dashboard.icon;
            }
            currentHierarchyNode.node.priority = dashboards.length - i + 1000;
        }

        return hierarchy.node.children;
    }
}
