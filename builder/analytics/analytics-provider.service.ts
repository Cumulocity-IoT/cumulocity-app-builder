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
import { ApplicationService, InventoryService } from '@c8y/ngx-components/api';
import { IAnalyticsProvider } from 'builder/app-list/app-builder-interface';
import { BehaviorSubject } from 'rxjs';
import { contextPathFromURL } from '../utils/contextPathFromURL';

@Injectable({providedIn: 'root'})
export class AnalyticsProviderService {

    appbuilderId: any;
    activeAnalyticsProvider: any;
    appBuilderConfig: any;
    refreshProviderList = new BehaviorSubject<void>(undefined);
    isAnalyticsProviderLoaded = false;
    constructor(private appService: ApplicationService, private inventoryService: InventoryService){
    }

    async getProviderList() {
        const AppBuilderConfigList = (await this.inventoryService.list( {pageSize: 2000, query: `type eq AppBuilder-Configuration`})).data;
        this.appBuilderConfig = (AppBuilderConfigList.length > 0 ? AppBuilderConfigList[0] : null);
        return this.appBuilderConfig;
   
    }
    
    refresh() {
        this.refreshProviderList.next(undefined);
    }

    private findActiveAnalyticsProivder() {
        let activeProvider = null;
        if(this.appBuilderConfig){
            const analyticsBuilderList = this.appBuilderConfig.analyticsProvider;
            if(analyticsBuilderList) {
                analyticsBuilderList.forEach((item: IAnalyticsProvider) => {
                    if(item.isActive) {
                        activeProvider =  item;
                    }
                });
            }
        }
        return activeProvider;
    }

    async getActiveAnalyticsProvider() {
        if(this.activeAnalyticsProvider) return this.activeAnalyticsProvider;
        else {
            if(this.appBuilderConfig) {
                this.activeAnalyticsProvider = this.findActiveAnalyticsProivder();
            } else {
                await this.getProviderList();
                this.activeAnalyticsProvider = this.findActiveAnalyticsProivder();
            }
        }    
        return this.activeAnalyticsProvider;    
    }
}
