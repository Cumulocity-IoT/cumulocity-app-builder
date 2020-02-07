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
    ComponentFactoryResolver,
    Injector,
    ViewChild,
    ViewContainerRef,
    OnInit,
    ComponentFactory
} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {
    DeviceSimulatorInstance,
    DeviceSimulatorService,
    DeviceSimulatorStrategy,
} from "../device-simulator/device-simulator.service";
import {InventoryService, ApplicationService} from '@c8y/client';

@Component({
    templateUrl: './edit-simulator-modal.component.html'
})
export class EditSimulatorModalComponent  implements OnInit{
    busy: boolean = false;

    @ViewChild("configWrapper", { read: ViewContainerRef }) configWrapper: ViewContainerRef;
    selectedStrategy: DeviceSimulatorStrategy;
    config: any;
    simulator: any;
    constructor(public bsModalRef: BsModalRef, private deviceSimulatorService: DeviceSimulatorService,
         private resolver: ComponentFactoryResolver, private injector: Injector, 
         private appService: ApplicationService) {

    }

    ngOnInit() {
        console.log('test');
        this.simulator = this.config.instance;
        this.openSimulatorConfig();
    }
    openSimulatorConfig() {

        const metadata = Reflect.getMetadata('simulationStrategy', this.config.simulatorClass)[0];

        this.configWrapper.clear();

        if (metadata.configComponent != null) {
            const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(metadata.configComponent);
            const componentRef = this.configWrapper.createComponent(factory);
            componentRef.instance.config = this.simulator.config;
        }
    }
    async saveAndClose() {
        
        this.busy = true;
        let appServiceData = (await this.appService.detail(this.deviceSimulatorService.getCurrentAppId())).data as any;

        let simulators = appServiceData.applicationBuilder.simulators
            .filter(x => x.id !== this.config.id);
        simulators.push({
            id: this.config.id,
            name: this.simulator.instanceName,
            type: this.config.name,
            config: this.simulator.config
        });

        appServiceData.applicationBuilder.simulators = simulators.length > 0 ? simulators : null

        await this.appService.update({
            id: this.deviceSimulatorService.getCurrentAppId(),
            applicationBuilder: appServiceData.applicationBuilder
        } as any);
        this.bsModalRef.hide();
    }
}