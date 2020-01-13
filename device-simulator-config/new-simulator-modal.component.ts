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
    ViewContainerRef
} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {WizardComponent} from "../wizard/wizard.component";
import {DeviceSimulatorService, DeviceSimulatorStrategy} from "../device-simulator/device-simulator.service";
import {InventoryService} from '@c8y/client';

@Component({
    templateUrl: './new-simulator-modal.component.html'
})
export class NewSimulatorModalComponent {
    busy: boolean = false;

    @ViewChild(WizardComponent) wizard: WizardComponent;

    @ViewChild("configWrapper", { read: ViewContainerRef }) configWrapper: ViewContainerRef;

    selectedStrategy: DeviceSimulatorStrategy;
    newConfig: any;
    deviceId: string | undefined;
    simulatorName: string = '';

    constructor(public bsModalRef: BsModalRef, private deviceSimulatorService: DeviceSimulatorService, private resolver: ComponentFactoryResolver, private injector: Injector, private inventoryService: InventoryService) {}

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

    async saveAndClose() {
        this.busy = true;

        let device;
        if (!this.deviceId) {
            // createDevice
            device = (await this.inventoryService.create({
                c8y_IsDevice: {}
            })).data;
        } else {
            // getExistingDevice
            device = (await this.inventoryService.detail(this.deviceId)).data;
        }

        // updateDevice
        const simulators = device.simulators || [];
        const simulatorId = Math.floor(Math.random() * 1000000);
        simulators.push({
            id: simulatorId,
            name: this.simulatorName,
            type: this.selectedStrategy.name,
            config: this.newConfig
        });
        await this.inventoryService.update({
            id: this.deviceId,
            simulators
        });

        this.deviceSimulatorService.createInstance(simulatorId, this.selectedStrategy.name, this.simulatorName, this.deviceId, this.newConfig);

        this.bsModalRef.hide();
    }
}