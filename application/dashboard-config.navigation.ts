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
import {_, NavigatorNode, NavigatorNodeFactory} from "@c8y/ngx-components";
import {BehaviorSubject} from "rxjs";
import {ActivationEnd, Router} from "@angular/router";
import {filter, map, startWith} from "rxjs/operators";

@Injectable()
export class DashboardConfigNavigation implements NavigatorNodeFactory {
    nodes = new BehaviorSubject<NavigatorNode[]>([]);

    constructor(private router: Router) {
        // Have to use the router and manually extract path rather than using ActivatedRoute because this route may be an ng1 route
        this.router.events
            .pipe(
                filter(event => event instanceof ActivationEnd),
                map((event: ActivationEnd) => event.snapshot.url),
                map(url => {
                    if (url.length >= 2 && url[0].path === 'application') {
                        const appId = url[1].path;
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