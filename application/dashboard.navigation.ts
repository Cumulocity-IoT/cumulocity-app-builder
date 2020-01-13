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
import {_, AppStateService, NavigatorNode, NavigatorNodeFactory} from "@c8y/ngx-components";
import {BehaviorSubject, combineLatest, from, of} from "rxjs";
import {ActivationEnd, Router} from "@angular/router";
import {distinctUntilChanged, filter, first, map, mapTo, startWith, switchMap, tap} from "rxjs/operators";
import {ApplicationService} from "@c8y/client";

@Injectable()
export class DashboardNavigation implements NavigatorNodeFactory {
    nodes = new BehaviorSubject<NavigatorNode[]>([]);

    private refreshSubject = new BehaviorSubject<void>(undefined);

    constructor(private router: Router, private appService: ApplicationService, appStateService: AppStateService) {
        // Have to use the router and manually extract path rather than using ActivatedRoute because this route may be an ng1 route
        const appId = this.router.events.pipe(
            filter(event => event instanceof ActivationEnd),
            map((event: ActivationEnd) => event.snapshot.url),
            map(url => {
                if (url.length >= 2 && url[0].path === 'application') {
                    return url[1].path;
                } else {
                    return undefined;
                }
            }),
            distinctUntilChanged()
        );

        combineLatest(appId, this.refreshSubject).pipe(
            map(([appId]) => appId),
            // Delay until after login - can't call appService.detail until logged in
            switchMap(appId => appStateService.currentUser.pipe(
                filter(user => user != null),
                first(),
                mapTo(appId)
            )),
            switchMap(appId => {
                if (appId) {
                    return from(this.appService.detail(appId))
                        .pipe(
                            map(res => res.data as any),
                            map(application => application.applicationBuilder.dashboards),
                            map(dashboards => this.dashboardsToNavNodes(appId, dashboards))
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

    dashboardsToNavNodes(appId: string, dashboards: {name: string, icon: string, id: string, deviceId?: string}[]): NavigatorNode[] {
        const hierarchy = dashboards.reduce((acc, dashboard, i) => {
            const path = dashboard.name.split('/').filter(pathSegment => pathSegment != '');
            const currentHierarchyNode = path.reduce((parent, segment, j) => {
                if (!parent.children[segment] || j == path.length - 1) {
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
            }, acc);

            if (dashboard.deviceId) {
                currentHierarchyNode.node.path = `/application/${appId}/dashboard/${dashboard.id}/device/${dashboard.deviceId}`;
            } else {
                currentHierarchyNode.node.path = `/application/${appId}/dashboard/${dashboard.id}`;
            }
            currentHierarchyNode.node.icon = dashboard.icon;
            currentHierarchyNode.node.priority = dashboards.length - i + 1000;
            return acc;
        }, {children: {}, node: new NavigatorNode({})} as any);

        return hierarchy.node.children;
    }
}