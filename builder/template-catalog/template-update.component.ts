import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { DashboardConfig } from "../application-config/dashboard-config.component";
import { DeviceSelectorModalComponent } from "../utils/device-selector/device-selector.component";
import { BsModalRef, BsModalService } from "ngx-bootstrap";
import { IManagedObject } from '@c8y/client';
import { TemplateDetails } from "./template-catalog.model";
import { TemplateCatalogService } from "./template-catalog.service";

@Component({
    selector: 'template-update-component',
    templateUrl: './template-update.component.html',
    styleUrls: ['template-catalog.less']
})
export class TemplateUpdateModalComponent implements OnInit {

    app: any;

    dashboardConfig: DashboardConfig;

    templateDetails: TemplateDetails;

    isLoadingIndicatorDisplayed = false;

    private deviceSelectorModalRef: BsModalRef;

    constructor(private modalService: BsModalService, private modalRef: BsModalRef, private catalogService: TemplateCatalogService) {

    }

    ngOnInit(): void {
        console.log('on Init');
        console.log(this.dashboardConfig);

        this.showLoadingIndicator();
        this.catalogService.getTemplateDetails(this.dashboardConfig.templateDashboard.id)
            .subscribe(templateDetails => {
                this.hideLoadingIndicator();
                // TODO add some checks
                templateDetails.input.devices = this.dashboardConfig.templateDashboard.devices ? this.dashboardConfig.templateDashboard.devices : [];
                templateDetails.input.images = this.dashboardConfig.templateDashboard.binaries ? this.dashboardConfig.templateDashboard.binaries : [];

                this.templateDetails = templateDetails;
            });
    }

    openDeviceSelectorDialog(index: number): void {
        this.deviceSelectorModalRef = this.modalService.show(DeviceSelectorModalComponent, { class: 'c8y-wizard', initialState: {} });
        this.deviceSelectorModalRef.content.onDeviceSelected.subscribe((selectedDevice: IManagedObject) => {
            this.templateDetails.input.devices[index].reprensentation = {
                id: selectedDevice.id,
                name: selectedDevice['name']
            };
        })
    }

    showLoadingIndicator(): void {
        this.isLoadingIndicatorDisplayed = true;
    }

    hideLoadingIndicator(): void {
        this.isLoadingIndicatorDisplayed = false;
    }

    onCancelButtonClicked(): void {
        this.modalRef.hide();
    }

    onSaveButtonClicked(): void {
        // this.catalogService.createDashboard(this.app, this.dashboardConfiguration, this.selectedTemplate, this.templateDetails);
        this.modalRef.hide();
    }

    isSaveButtonEnabled(): boolean {
        return false;
    }
}