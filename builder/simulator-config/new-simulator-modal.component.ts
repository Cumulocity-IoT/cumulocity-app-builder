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

import {
    Component,
    ComponentFactory,
    ComponentFactoryResolver, ComponentRef,
    Injector,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { WizardComponent } from "../../wizard/wizard.component";
import { InventoryService, ApplicationService, IManagedObject } from '@c8y/client';
import { AppIdService } from "../app-id.service";
import { SimulationStrategyConfigComponent, SimulationStrategyFactory } from "../simulator/simulation-strategy";
import { SimulationStrategiesService } from "../simulator/simulation-strategies.service";
import { SimulatorCommunicationService } from "../simulator/mainthread/simulator-communication.service";
import { throwError } from 'rxjs';

@Component({
    templateUrl: './new-simulator-modal.component.html'
})
export class NewSimulatorModalComponent {
    busy: boolean = false;
    isConfigFileUploading: boolean = false;
    isConfigFileError: boolean = false;

    @ViewChild(WizardComponent, { static: true }) wizard: WizardComponent;

    @ViewChild("configWrapper", { read: ViewContainerRef, static: true }) configWrapper: ViewContainerRef;

    selectedStrategyFactory: SimulationStrategyFactory;
    newConfig: any;
    deviceId: string | undefined;
    simulatorName: string = '';
    deviceName: string | undefined;
    groupName: string | undefined;
    numberOfDevice: number | 0;
    isGroup: boolean = false;
    configFromFile: any;

    constructor(
        private simSvc: SimulatorCommunicationService,
        public bsModalRef: BsModalRef, public simulationStrategiesService: SimulationStrategiesService,
        private resolver: ComponentFactoryResolver, private injector: Injector, private inventoryService: InventoryService,
        private appService: ApplicationService, private appIdService: AppIdService
    ) { }

    openSimulatorConfig() {
        this.wizard.selectStep('config');

        const metadata = this.selectedStrategyFactory.getSimulatorMetadata();

        this.configWrapper.clear();

        if (metadata.configComponent != null) {
            const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(metadata.configComponent);
            const componentRef: ComponentRef<SimulationStrategyConfigComponent> = this.configWrapper.createComponent(factory);
            componentRef.instance.config = this.newConfig = {};

            if (this.configFromFile === undefined || this.configFromFile === null) {
                componentRef.instance.initializeConfig();
            } else {
                componentRef.instance.initializeConfig(this.configFromFile);
            }

            this.newConfig = componentRef.instance.config;//TODO: needed after merge? 

            if (componentRef.instance.config.modalSize) {
                this.bsModalRef.setClass(componentRef.instance.config.modalSize);
            }
            this.newConfig.metadata = metadata;

        }
    }

    resetDialogSize() {
        this.bsModalRef.setClass('modal-sm');
    }

    public isConfigFromFileUploaded() {
        if (this.configFromFile === undefined || this.configFromFile === null) {
            return false;
        }
        return true;
    }

    async saveAndClose() {
        this.busy = true;

        const metadata = this.selectedStrategyFactory.getSimulatorMetadata();
        // get simulator Name from strategy's deviceName field
        if (metadata.hideSimulatorName) {
            this.simulatorName = this.newConfig.deviceName;
        }
        let device;
        if (!this.deviceId) {
            if (this.isGroup) {
                // Create Group and Devices
                device = await this.AddGroupAndDevices();
                this.deviceName = this.groupName;
                this.deviceId = device.id;
            } else {
                // createDevice
                device = (await this.inventoryService.create({
                    c8y_IsDevice: {},
                    name: this.simulatorName
                })).data;
                this.deviceName = this.simulatorName;
                this.deviceId = device.id;
            }

        } else {
            // getExistingDevice
            // device = (await this.inventoryService.detail(this.deviceId)).data;
        }
        //  this.deviceId = device.id;

        const appId = this.appIdService.getCurrentAppId();
        let appServiceData;
        if (appId) {
            appServiceData = (await this.appService.detail(appId)).data;
        }
        // updateDevice
        const simulators = appServiceData.applicationBuilder.simulators || [];
        const simulatorId = Math.floor(Math.random() * 1000000);
        this.newConfig.deviceId = this.deviceId;
        this.newConfig.deviceName = this.deviceName;
        this.newConfig.isGroup = this.isGroup;
        const newSimulatorObject = {
            id: simulatorId,
            name: this.simulatorName,
            type: metadata.name,
            config: this.newConfig
        };
        simulators.push(newSimulatorObject);
        appServiceData.applicationBuilder.simulators = simulators;

        await this.appService.update({
            id: appId,
            applicationBuilder: appServiceData.applicationBuilder
        } as any);

        // We could just wait for them to refresh, but it's nicer to instantly refresh
        await this.simSvc.simulator.checkForSimulatorConfigChanges();

        this.bsModalRef.hide();
    }
    getSelectedDevice(device: any) {
        this.deviceId = device.id;
        this.deviceName = device.name;
    }

    private async AddGroupAndDevices() {
        let group = null;
        group = (await this.inventoryService.create({
            c8y_IsDeviceGroup: {},
            name: this.groupName,
            type: "c8y_DeviceGroup"
        })).data;
        for (let index = 0; index < this.numberOfDevice; index++) {
            const childManageObject: Partial<IManagedObject> = {
                c8y_IsDevice: {},
                name: this.simulatorName + '-' + (index + 1),
            };
            await this.inventoryService.childAssetsCreate(childManageObject, group.id);
        }
        return group;
    }

    fileUploaded(events) {
        this.isConfigFileError = false;
        this.isConfigFileUploading = true;
        const file = events.target.files[0];
        const reader = new FileReader();
        let input = null;
        reader.addEventListener('load', (event: any) => {
            input = event.target.result;
            const validJson = this.isValidJson(input);
            if (validJson) {
                this.selectedStrategyFactory = this.simulationStrategiesService.strategiesByName.get(validJson.type);
                if (this.selectedStrategyFactory === undefined) {
                    this.isConfigFileError = true;
                } else {
                    this.configFromFile = validJson.config;
                    this.wizard.selectStep('device');
                }
            } else {
                this.isConfigFileError = true;
                events.srcElement.value = "";
            }
            this.isConfigFileUploading = false;
        });
        if (file) {
            reader.readAsText(file);
        } else {
            this.configFromFile = null;
            this.isConfigFileUploading = false;
        }
    }

    /**
     *
     * @param input Validate JSON Input
     */
    private isValidJson(input: any) {
        try {
            if (input) {
                const o = JSON.parse(input);
                if (o && (o.constructor === Object || o.constructor === Array)) {
                    return o;
                }
            }
        } catch (e) { }
        return false;
    }
}
