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

import {Component} from '@angular/core';
import {DeviceSimulatorInstance, DeviceSimulatorService} from "../device-simulator/device-simulator.service";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {NewSimulatorModalComponent} from "./new-simulator-modal.component";
import {EditSimulatorModalComponent} from "./edit-simulator-modal.component";
import {InventoryService} from '@c8y/client';

@Component({
    templateUrl: './device-simulator-config.component.html'
})
export class DeviceSimulatorConfigComponent {
    bsModalRef: BsModalRef;

    constructor(private deviceSimulatorSvc: DeviceSimulatorService, private modalService: BsModalService, private inventoryService: InventoryService) {}

    showCreateSimulatorDialog() {
        this.bsModalRef = this.modalService.show(NewSimulatorModalComponent, { class: 'c8y-wizard' });
    }

    async showEditSimulatorDialog(simulator: DeviceSimulatorInstance) {
        const simConfig = (await this.inventoryService.detail(simulator.deviceId)).data;

        this.bsModalRef = this.modalService.show(EditSimulatorModalComponent, { class: 'c8y-wizard', initialState: { config: simulator } })
    }
}