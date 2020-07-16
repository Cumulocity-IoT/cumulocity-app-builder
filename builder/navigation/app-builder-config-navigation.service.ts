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
import {BehaviorSubject} from "rxjs";
import {map, startWith} from "rxjs/operators";
import {UserService} from "@c8y/client";
import {AppIdService} from "../app-id.service";

@Injectable()
export class AppBuilderConfigNavigationRegistrationService {
    appId: string|undefined = undefined;
    configNode = new NavigatorNode({
        label: 'Configuration',
        icon: 'wrench',
        path: `/`,
        priority: 0
    });

    private listenerId = 0;
    private listeners = new Map<number, ((appId: string|undefined, navNode: NavigatorNode) => void)>();

    changeConfigNode(appId: string|undefined, configNode: NavigatorNode) {
        this.configNode = configNode;
        for (const listener of Array.from(this.listeners.values())) {
            listener(appId, configNode);
        }
    }

    registerNewConfigListener(listener: (appId: string|undefined, navNode: NavigatorNode) => void): number {
        const id = this.listenerId++;
        this.listeners.set(id, listener);
        listener(this.appId, this.configNode);
        return id;
    }

    unregisterNewConfigListener(id: number): boolean {
        return this.listeners.delete(id);
    }
}

/**
 * Add the configuration menu item to the navigation.
 * Sub-items can be added via the AppBuilderConfigNavigationRegistrationService
 */
@Injectable()
export class AppBuilderConfigNavigationService implements NavigatorNodeFactory {
    nodes = new BehaviorSubject<NavigatorNode[]>([]);
    constructor(appIdService: AppIdService, private configNavService: AppBuilderConfigNavigationRegistrationService, appStateService: AppStateService, userService: UserService) {
        configNavService.registerNewConfigListener((appId, configNode) => {
            configNode.add( new NavigatorNode({
                label: 'Styling',
                icon: 'paint-brush',
                path: `/application/${appId}/branding`,
                priority: 2
            }));
        });
        configNavService.registerNewConfigListener((appId, configNode) => {
            configNode.add(new NavigatorNode({
                label: 'Simulator',
                icon: 'c8y-simulator',
                path: `/application/${appId}/simulator-config`,
                priority: 1
            }));
        });

        appIdService.appIdDelayedUntilAfterLogin$
            .pipe(
                map(appId => {
                    if (appId) {
                        const configNode = new NavigatorNode({
                            label: 'Configuration',
                            icon: 'wrench',
                            priority: 0
                        });
                        configNode.add(new NavigatorNode({
                            label: 'General',
                            icon: 'wrench',
                            path: `/application/${appId}/config`,
                            priority: 10
                        }));
                        configNavService.changeConfigNode(appId, configNode);
                        if (userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN","ROLE_APPLICATION_MANAGEMENT_ADMIN"])) {
                            return [configNode];
                        } else {
                            return [];
                        }
                    } else {
                        return [];
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
