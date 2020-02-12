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
import {BehaviorSubject} from "rxjs";
import {map, startWith} from "rxjs/operators";
import {AppIdService} from "../app-id.service";

@Injectable()
export class DashboardConfigNavigation implements NavigatorNodeFactory {
    nodes = new BehaviorSubject<NavigatorNode[]>([]);

    constructor(appIdService: AppIdService) {
        appIdService.appId$
            .pipe(
                map(appId => {
                    if (appId != undefined) {
                        return [
                            new NavigatorNode({
                                label: 'Dashboard Config',
                                icon: 'wrench',
                                path: `/application/${appId}/config`,
                                priority: 0
                            })  
                        ]
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