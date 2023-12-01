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

import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import { InventoryService, IResultList, IManagedObject } from '@c8y/client';
import { Observable, Observer} from 'rxjs';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { ControlContainer, NgForm } from '@angular/forms';
import { generateRegEx } from "../../builder/utils/global-fun";

@Component({
    selector: 'device-selector',
    templateUrl: './device-selector.component.html',
    viewProviders: [ { provide: ControlContainer, useExisting: NgForm } ]
})
export class DeviceSelectorComponent implements OnInit{
    @Input() value: string;
    @Input() placeHolder: string;
    @Input() placeHolderType: string;
    @Input() required: boolean;
    @Input() isGroup: boolean;
    @Input() isTypeSupport: boolean;
    @Input() isTypeSelected: boolean;
    @Output() selectedDevice = new EventEmitter<string>();
    @Output() onBlurDevice = new EventEmitter<string>();
    @Output() selectedType = new EventEmitter<string>();
    @Output() onBlurType = new EventEmitter<string>();
    suggestions$: Observable<any[]>;
    deviceList :any[] = [];
    typeaheadLoading: boolean = false;
    field_id: string;
    isTypeInput = false;

    constructor(private inventoryService: InventoryService) {}
    ngOnInit(): void {
        this.field_id = "id"+Math.floor(Math.random() * 1000000);
        this.isTypeInput = (this.isTypeSelected ? true: false);

        this.suggestions$ = new Observable((observer: Observer<any>) => {
            const item: any = {
                id : '',
                name : this.value
            }
            if(this.isTypeSelected) {
                this.isTypeInput = true;
                this.selectedType.emit(this.value);
            } else {
                this.selectedDevice.emit(item);
            }
            this.getAllDevices(1, this.value).then ( res => {
                if(this.isTypeInput){
                    observer.next(this.getDeviceAssetType(res.data));
                }else {
                    observer.next(res.data);
                }
            });
        });
      }

    private getDeviceAssetType(data: any) {
        let deviceTypes = Array.from(new Set(data.map(item => item.type)));
        deviceTypes = deviceTypes.filter(n => n);
        return deviceTypes;
    } 

    // Get All devices based on query search parameter
    private getAllDevices(pageToGet: number,  searchName ?: any) : Promise<IResultList<IManagedObject>>{
        const inventoryFilter = {
            pageSize: (this.isTypeInput ? 50: 5),
            withTotalPages: true,
            currentPage: pageToGet
        };
        if (searchName) {
            if(this.isTypeInput){
                inventoryFilter['query'] = `$filter=(hasany(c8y_IsDevice,c8y_IsAsset) and (type eq '${generateRegEx(searchName)}')) $orderby=name asc`;
            }
            else if(this.isGroup) {
                inventoryFilter['query'] = `$filter=(hasany(c8y_IsDeviceGroup,c8y_IsAsset) and (name eq '${generateRegEx(searchName)}')) $orderby=name asc`;
            } else {
                inventoryFilter['query'] = `$filter=(hasany(c8y_IsDevice,c8y_IsAsset) and (name eq '${generateRegEx(searchName)}')) $orderby=name asc`;
            }
        } else {
            inventoryFilter['query'] = `$filter=(hasany(c8y_IsDevice,c8y_IsAsset)) $orderby=name asc`;
        }
        return this.inventoryService.list(inventoryFilter);
    
    }
    onSelect(event: TypeaheadMatch): void {
        this.selectedDevice.emit(event.item);
    }

    typeaheadOnBlur(event: TypeaheadMatch): void {
        this.onBlurDevice.emit(event.item);
    }
    onSelectType(event: TypeaheadMatch): void {
        this.selectedType.emit(event.item);
    }

    typeaheadOnBlurType(event: TypeaheadMatch): void {
        this.onBlurType.emit(event.item);
    }
    changeTypeaheadLoading(e: boolean): void {
        this.typeaheadLoading = e;
    }

    typeInputChange() {
        this.value = "";
        this.isTypeSelected = (this.isTypeInput ? true: false);
    }
}
