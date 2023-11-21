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
import { Component, OnInit } from "@angular/core";
import { IManagedObject } from '@c8y/client';
import { BsModalRef } from "ngx-bootstrap/modal";
import { Subject } from "rxjs";
import { DeviceSelectorModalService } from "./device-selector.service";

@Component({
    selector: 'device-selector-modal',
    templateUrl: './device-selector.template.html',
    styleUrls: ['styles.less']
})
export class DeviceSelectorModalComponent implements OnInit {

    public onDeviceSelected: Subject<IManagedObject>;
    public onTypeSelected: Subject<string>;

    searchString: string;

    templateType: number;

    devices: IManagedObject[] = [];

    deviceSelected: IManagedObject;

    typeSelected: string;

    title = "Select Device/Asset";

    types: any[] = [];

    constructor(private modalRef: BsModalRef, private devicesService: DeviceSelectorModalService) { }

    ngOnInit(): void {
        switch (this.templateType) {
            case 1:
                this.onDeviceSelected = new Subject();
                this.title = "Select Group/Asset"
                break;
            
            case 2:
                this.onTypeSelected = new Subject();
                this.title = "Select Device/Asset Type"
                break;
        
            default:
                this.onDeviceSelected = new Subject();
                break;
        }
        this.loadDevices();
    }

    loadDevices() {
        this.devicesService.queryDevices(this.templateType)
            .then(response => {
                this.devices = response.data as IManagedObject[];
                if(this.templateType == 2) {
                    this.types =this.getDeviceAssetType();
                }
            });
    }

    searchForDevice(): void {
        this.devicesService.queryDevices(this.templateType, this.searchString )
            .then(response => {
                this.devices = response.data as IManagedObject[];
                if(this.templateType == 2) {
                    this.types =this.getDeviceAssetType();
                }
            });
    }

    private getDeviceAssetType() {
        let deviceTypes = Array.from(new Set(this.devices.map(item => item.type)));
        deviceTypes = deviceTypes.filter(n => n);
        return deviceTypes;
    }

    clearSearch(): void {
        this.searchString = '';
        this.loadDevices();
    }

    selectDevice(device: IManagedObject): void {
        this.deviceSelected = device;
    }

    selectType(type: string): void {
        this.typeSelected = type;
    }

    isDeviceSelected(device: IManagedObject): boolean {
        return this.deviceSelected && this.deviceSelected.id === device.id;
    }

    isTypeSelected(type: string): boolean {
        return this.typeSelected && this.typeSelected === type;
    }


    isSelectButtonEnabled() {
        return this.deviceSelected || this.typeSelected;
    }

    closeDialog(): void {
        this.modalRef.hide();
    }

    onSelectButtonClicked(): void {
        if(this.templateType == 2) {
            this.onTypeSelected.next(this.typeSelected);
        } else {
            this.onDeviceSelected.next(this.deviceSelected);
        }
        this.closeDialog();
    }
}