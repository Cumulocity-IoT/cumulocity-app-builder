import {Component, OnDestroy, ViewChild} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {ApplicationService, InventoryService} from '@c8y/client';
import {WizardComponent} from "../../wizard/wizard.component";
import {DashboardNavigation} from "../dashboard.navigation";
import {WELCOME_DASHBOARD_TEMPLATE} from "./dashboard-templates";
import {Subject} from "rxjs";

@Component({
    templateUrl: './edit-dashboard-modal.component.html'
})
export class EditDashboardModalComponent {
    busy = false;

    dashboardName: string = '';
    dashboardIcon: string = 'th';
    deviceId: string = '';

    index: number = 0;

    app: any;

    @ViewChild(WizardComponent) wizard: WizardComponent;

    constructor(public bsModalRef: BsModalRef, private appService: ApplicationService, private inventoryService: InventoryService, private navigation: DashboardNavigation) {}

    async save() {
        this.busy = true;

        const dashboard = this.app.applicationBuilder.dashboards[this.index];
        dashboard.name = this.dashboardName;
        dashboard.icon = this.dashboardIcon;
        dashboard.deviceId = this.deviceId;

        await this.appService.update({
            id: this.app.id,
            applicationBuilder: this.app.applicationBuilder
        } as any);
        this.bsModalRef.hide();
        this.navigation.refresh();
    }
}