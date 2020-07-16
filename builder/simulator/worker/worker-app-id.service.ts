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

import { Injectable } from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {AppIdService} from "../../app-id.service";
import {AppStateService} from "@c8y/ngx-components";
import {filter, first, mapTo, switchMap} from "rxjs/operators";

/**
 * The worker is passed it's appId from the main thread so the service to get it is slightly different but meets the same interface
 */
@Injectable()
export class WorkerAppIdService implements AppIdService {
    appId$: BehaviorSubject<string | undefined> = new BehaviorSubject<string|undefined>(undefined);
    appIdDelayedUntilAfterLogin$: Observable<string | undefined>;

    constructor(private appStateService: AppStateService) {
        this.appIdDelayedUntilAfterLogin$ = this.appId$.pipe(
            switchMap(url => appStateService.currentUser.pipe(
                filter(user => user != null),
                first(),
                mapTo(url)
            ))
        );
    }

    getCurrentAppId(): string | undefined {
        return this.appId$.value;
    }
}
