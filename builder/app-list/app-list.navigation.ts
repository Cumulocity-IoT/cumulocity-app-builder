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
import {AppStateService, NavigatorNode, NavigatorNodeFactory} from "@c8y/ngx-components";
import { UserService } from '@c8y/ngx-components/api';
import {BehaviorSubject} from "rxjs";
import {map, startWith} from "rxjs/operators";
import {AppIdService} from "../app-id.service";


@Injectable()
export class AppListNavigation implements NavigatorNodeFactory {
    nodes = new BehaviorSubject<NavigatorNode[]>([]);

    constructor(appIdService: AppIdService, private appStateService: AppStateService, private userService: UserService) {

        
        // Only show the app-list navigation if we aren't in an app-builder application
        appIdService.appId$
            .pipe(
                map(appId => {
                    if (appId != undefined) {
                        return []
                    } else {
                        const appNode = [];
                        appNode.push(new NavigatorNode({
                            label: 'Home',
                            icon: 'home',
                            path: `/home`,
                            priority: 3
                        }));
                        appNode.push(new NavigatorNode({
                            label: 'All Applications',
                            icon: 'wrench',
                            path: `/application-builder`,
                            priority: 2
                        }));
                        const settingsNode =  new NavigatorNode({
                            label: 'Settings',
                            icon: 'cogs',
                            priority: 0
                        });
                        settingsNode.add(new NavigatorNode({
                            label: 'Custom Properties',
                            icon: 'cog',
                            path: `/settings-properties`,
                            priority: 1
                        }));
                        if (this.userService.hasAllRoles(this.appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN","ROLE_APPLICATION_MANAGEMENT_ADMIN"])) {
                            appNode.push(settingsNode);
                        }
                        return appNode;
                    }
                }),
                startWith([])
            )
            // Not sure why I have to use an intermediate behavior subject... seems like a c8y bug?
            .subscribe(this.nodes);
    }

    get() {
        return this.nodes;
    }
}
