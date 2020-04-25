import {Component, Input, OnInit} from "@angular/core";
import {AsyncWidgetService} from "./async-widget.service";
import {WidgetInstallerService} from "../widget-installer/widget-installer.service";

@Component({
    template: `
        <ng-container *ngIf="loading else notLoading">Loading widget.... Please wait</ng-container>
        <ng-template #notLoading>
            <ng-container *ngIf="failed else success">Unable to load widget! Would you like to <a (click)="widgetInstallerService.installWidget()">install the widget</a>?</ng-container>
        </ng-template>
        <ng-template #success>
            <c8y-widget-downgrade [componentid]="componentid" [config]="config"></c8y-widget-downgrade>
        </ng-template>
    `
})
export class AsyncWidgetLoaderComponent implements OnInit {
    loading = true;
    failed = false;

    @Input() componentid;
    @Input() config;

    constructor(private asyncWidgetService: AsyncWidgetService, private widgetInstallerService: WidgetInstallerService) {}

    ngOnInit(): void {
        this.asyncWidgetService.widgetLoaded(this.componentid)
            .then((widgetConfig) => {
                this.loading = false;
                if (!widgetConfig) {
                    this.failed = true;
                }
            })
    }

}
