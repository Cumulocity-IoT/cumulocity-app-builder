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

import {distinctUntilChanged, filter, first, map, mapTo, switchMap} from "rxjs/operators";
import {BehaviorSubject, Observable, of} from "rxjs";
import {Injectable} from "@angular/core";
import {AppStateService} from "@c8y/ngx-components";
import {ActivationEnd, ParamMap, Router} from "@angular/router";
import {get} from "lodash-es";

@Injectable({providedIn: 'root'})
export class AppIdService {
    /** The latest appId (from the url eg: '/application/123/dashboard/xyz' => '123') */
    readonly appId$ = new BehaviorSubject<string|undefined>(undefined);
    /** same as the appId$ but the value is pended until after the user logs in */
    readonly appIdDelayedUntilAfterLogin$: Observable<string|undefined>;

    constructor(router: Router, appStateService: AppStateService) {
        router.events.pipe(
                filter(event => event instanceof ActivationEnd),
                switchMap(() => get(router.routerState.root, 'firstChild.paramMap') as Observable<ParamMap> | undefined || of(undefined)),
                map(paramMap => paramMap != null ? paramMap.get('applicationId') : undefined),
                distinctUntilChanged()
            )
            .subscribe(this.appId$);

        this.appIdDelayedUntilAfterLogin$ = this.appId$.pipe(
            switchMap(url => appStateService.currentUser.pipe(
                filter(user => user != null),
                first(),
                mapTo(url)
            )
        ));
    }

    /** Gets the current appId (from the url eg: '/application/123/dashboard/xyz' => '123') */
    getCurrentAppId(): string | undefined {
        return this.appId$.getValue();
    }
}
