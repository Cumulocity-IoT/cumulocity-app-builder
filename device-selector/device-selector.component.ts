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

import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import { InventoryService, IResultList, IManagedObject } from '@c8y/client';
import { Observable, Observer} from 'rxjs';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { ControlContainer, NgForm } from '@angular/forms';

@Component({
    selector: 'device-selector',
    templateUrl: './device-selector.component.html',
    viewProviders: [ { provide: ControlContainer, useExisting: NgForm } ]
})
export class DeviceSelectorComponent implements OnInit{
    @Input() value: string;
    @Input() placeHolder: string;
    @Input() required: boolean;
    @Input() isGroup: boolean;
    @Output() selectedDevice = new EventEmitter<string>();
    @Output() onBlurDevice = new EventEmitter<string>();
    suggestions$: Observable<any[]>;
    deviceList :any[] = [];
    typeaheadLoading: boolean = false;
    field_id: string;

    constructor(private inventoryService: InventoryService) {}
    ngOnInit(): void {
        this.field_id = "id"+Math.floor(Math.random() * 1000000);

        this.suggestions$ = new Observable((observer: Observer<any>) => {
            const item: any = {
                id : '',
                name : this.value
            }
            this.selectedDevice.emit(item);
            this.getAllDevices(1, this.value).then ( res => {
                observer.next(res.data);
            });
        });
      }

    // Get All devices based on query search parameter
    private getAllDevices(pageToGet: number,  searchName ?: any) : Promise<IResultList<IManagedObject>>{
        const inventoryFilter = {
            pageSize: 5,
            withTotalPages: true,
            currentPage: pageToGet
        };
        if (searchName) {
            if(this.isGroup) {
                inventoryFilter['query'] = `$filter=(hasany(c8y_IsDeviceGroup,c8y_IsAsset) and (name eq '${this.generateRegEx(searchName)}'))`;
            } else {
                inventoryFilter['query'] = `$filter=(hasany(c8y_IsDevice,c8y_IsAsset) and (name eq '${this.generateRegEx(searchName)}'))`;
            }
        } else {
            inventoryFilter['query'] = `$filter=(hasany(c8y_IsDevice,c8y_IsAsset))`;
        }
        return this.inventoryService.list(inventoryFilter);
    
    }
    onSelect(event: TypeaheadMatch): void {
        this.selectedDevice.emit(event.item);
    }

    typeaheadOnBlur(event: TypeaheadMatch): void {
        this.onBlurDevice.emit(event.item);
    }
    changeTypeaheadLoading(e: boolean): void {
        this.typeaheadLoading = e;
    }

    // Regular expression for validation
    generateRegEx(input) {
        const name = input + '';
        const nameLower = name.toLowerCase();
        const nameUpper = name.toUpperCase();
        let regex = '*';
        const numRegex = new RegExp(/^([0-9]+)$/);
        const splCharRegex = new RegExp(/^([,._-]+)$/);
        for (let i = 0; i < name.length; i++) {
          if (name.charAt(i) === ' ') {
            regex += ' ';
          } else if (name.charAt(i).match(numRegex)) {
            regex += '[' + name.charAt(i) + ']';
          } else if (name.charAt(i).match(splCharRegex)) {
            regex += '[' + name.charAt(i) + ']';
          } else {
            regex += '[' + nameLower.charAt(i) + '|' + nameUpper.charAt(i) + ']';
          }
        }
        regex += '*';
        return regex;
    }
}
