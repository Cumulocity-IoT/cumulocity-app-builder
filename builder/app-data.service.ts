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

import {from, Observable} from "rxjs";
import {Injectable} from "@angular/core";
import { ApplicationService, IApplication } from "@c8y/client";

@Injectable({providedIn: 'root'})
export class AppDataService {

    APP_DETAILS_REFRESH_INTERVAL = 5000; // Milliseconds

    private appDetails: Observable<any>;
    private appId: string | number = '';
    private lastUpdated = 0; 
    forceUpdate = false;
    constructor(private appService: ApplicationService) {
    }

    getAppDetails(appId: string): Observable<any> {
        const currentTime = Date.now();
        if(appId && (appId !== this.appId || this.forceUpdate)) {
            this.appId = appId;
            if(this.forceUpdate || this.lastUpdated == 0 || ( currentTime - this.lastUpdated > this.APP_DETAILS_REFRESH_INTERVAL)){
                this.appDetails = from(this.appService.detail(appId).then(res => res.data as any));
                this.lastUpdated = Date.now();
                this.forceUpdate = false;
            }
        }
        return this.appDetails;
    }
}
