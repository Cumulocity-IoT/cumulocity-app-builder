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
    ComponentFactoryResolver,
    Injector,
    ViewChild,
    ViewContainerRef,
    OnInit
} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {WizardComponent} from "../wizard/wizard.component";
import {DeviceSimulatorService, DeviceSimulatorStrategy} from "../device-simulator/device-simulator.service";
import {InventoryService, ApplicationService} from '@c8y/client';
import {AppIdService} from "../app-id.service";
@Component({
    templateUrl: './new-simulator-modal.component.html'
})
export class NewSimulatorModalComponent implements OnInit{
    busy: boolean = false;

    @ViewChild(WizardComponent) wizard: WizardComponent;

    @ViewChild("configWrapper", { read: ViewContainerRef }) configWrapper: ViewContainerRef;

    selectedStrategy: DeviceSimulatorStrategy;
    newConfig: any;
    deviceId: string | undefined;
    simulatorName: string = '';

    constructor(public bsModalRef: BsModalRef, private deviceSimulatorService: DeviceSimulatorService,
        private resolver: ComponentFactoryResolver, private injector: Injector, private inventoryService: InventoryService,
        private appService: ApplicationService, private appIdService: AppIdService) {}

    ngOnInit() {
    }
    openSimulatorConfig() {
        this.wizard.selectStep('config');

        const metadata = Reflect.getMetadata('simulationStrategy', this.selectedStrategy.simulatorClass)[0];

        this.configWrapper.clear();

        if (metadata.configComponent != null) {
            const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(metadata.configComponent);
            const componentRef = this.configWrapper.createComponent(factory);
            componentRef.instance.config = this.newConfig = {};
        }
    }


    /**
     *
     * Create Simulator and close Modal Dialog
     * @memberof NewSimulatorModalComponent
     */
    async saveAndClose() {
        this.busy = true;

        let device;
        if (!this.deviceId) {
            // createDevice
            device = (await this.inventoryService.create({
                c8y_IsDevice: {},
                name: this.simulatorName
            })).data;
        } else {
            // getExistingDevice
            device = (await this.inventoryService.detail(this.deviceId)).data;
        }
        this.deviceId = device.id;
        
        const appId = this.appIdService.getCurrentAppId();
        let appServiceData;
        if(appId){
            appServiceData = (await this.appService.detail(appId)).data;
        
        }
        // updateDevice
        const simulators = appServiceData.applicationBuilder.simulators || [];
        const simulatorId = Math.floor(Math.random() * 1000000);
        this.newConfig.deviceId = this.deviceId;
        this.newConfig.isSimulatorStarted = false;
        const newSimulatorObject = {
            id: simulatorId,
            name: this.simulatorName,
            type: this.selectedStrategy.name,
            config: this.newConfig
        };
        simulators.push(newSimulatorObject);
        appServiceData.applicationBuilder.simulators = simulators;
        console.log(appServiceData);
        await this.appService.update({
            id: appId,
            applicationBuilder: appServiceData.applicationBuilder
        } as any);

        // No need to ask the device simulator to create the new instance - this will be automatically picked up after the appService.update(...)

        this.bsModalRef.hide();
    }
}