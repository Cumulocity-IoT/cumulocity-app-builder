import {
    Component,
    ComponentFactoryResolver,
    Injector,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {
    DeviceSimulatorInstance,
    DeviceSimulatorService,
} from "../device-simulator/device-simulator.service";
import {InventoryService} from '@c8y/client';

@Component({
    templateUrl: './edit-simulator-modal.component.html'
})
export class EditSimulatorModalComponent {
    busy: boolean = false;

    @ViewChild("configWrapper", { read: ViewContainerRef }) configWrapper: ViewContainerRef;

    simulator: DeviceSimulatorInstance;

    constructor(public bsModalRef: BsModalRef, private deviceSimulatorService: DeviceSimulatorService, private resolver: ComponentFactoryResolver, private injector: Injector, private inventoryService: InventoryService) {

    }
}