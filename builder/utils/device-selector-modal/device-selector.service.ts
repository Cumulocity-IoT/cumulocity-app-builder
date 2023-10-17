/*
* Copyright (c) 2023 Software AG, Darmstadt, Germany and/or its licensors
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
import { InventoryService, IManagedObject, IResultList } from '@c8y/client';
import { generateRegEx } from "../global-fun";

@Injectable()
export class DeviceSelectorModalService {

    private readonly LIST_FILTER = {
        pageSize: 50,
        withTotalPages: true
    };

    constructor(private inventoryService: InventoryService) {

    }

    queryDevices(templateType?: number, deviceName?: string): Promise<IResultList<IManagedObject>> {
        let searchString = deviceName ? `${deviceName}` : '';
        if(templateType == 1){
            return this.inventoryService.listQuery({ __filter: { __and: [{ __or: [{__has: 'c8y_IsDeviceGroup' }, {__has: 'c8y_IsAsset'  } ]}, { name: generateRegEx(searchString) }] } , __orderby: [ {'name': 1}]}, this.LIST_FILTER);
        } else if(templateType == 2){
            return this.inventoryService.listQuery({ __filter: { __and: [{ __or: [{__has: 'c8y_IsDevice' }, {__has: 'c8y_IsAsset'  } ]}, { type: generateRegEx(searchString) }] } , __orderby: [ {'name': 1}]}, this.LIST_FILTER);
        }
        return this.inventoryService.listQuery({ __filter: { __and: [{ __or: [{__has: 'c8y_IsDevice' }, {__has: 'c8y_IsAsset'  } ]}, { name: generateRegEx(searchString) }] } , __orderby: [ {'name': 1}]}, this.LIST_FILTER);
    }
}