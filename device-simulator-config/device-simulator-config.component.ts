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