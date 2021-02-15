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

import {Inject, Injectable} from "@angular/core";
import { ApplicationService, InventoryService } from '@c8y/ngx-components/api';
import { contextPathFromURL } from '../utils/contextPathFromURL';


@Injectable()
export class AnalyticsProviderService {

    appbuilderId: any;
    constructor(private appService: ApplicationService, private inventoryService: InventoryService){
    }

    async getProviderList() {
        let appList = (await this.appService.list({pageSize: 2000})).data;
        let appBuilder: any;
        appBuilder = appList.find((app: any) => app.contextPath === contextPathFromURL());
        this.appbuilderId = appBuilder.id;
        const AppBuilderConfigList = (await this.inventoryService.list( {pageSize: 2000, query: `type eq AppBuilder-Configuration`})).data;
        return AppBuilderConfigList.find(appConfig => appConfig.appBuilderId === appBuilder.id);
   
    }
    
    async getAppBuilderId() {
        if(this.appbuilderId) return this.appbuilderId 
        else {
            await this.getProviderList();
            return this.appbuilderId;
        }
    }
}
