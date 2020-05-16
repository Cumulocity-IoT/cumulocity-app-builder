import {Component, OnDestroy} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {ContextDashboardType} from "@c8y/ngx-components/context-dashboard";
import { InventoryService, ApplicationService, IApplication } from "@c8y/client";
import {last} from "lodash-es";

type IApplicationBuilderApplication = IApplication & {
    applicationBuilder: {
        dashboards: {
            id: string,
            name: string,
            tabGroup?: string,
            visibility?: '' | 'hidden' | 'no-nav',
            icon: string
        }[]
    }
}

@Component({
    selector: 'app-builder-context-dashboard',
    template: `
        <c8y-tab *ngFor="let tab of tabs" [icon]="tab.icon" [label]="tab.label" [path]="tab.path" [priority]="tab.priority"></c8y-tab>
       
        <ng-container [ngSwitch]="deviceDetail">
            <div *ngSwitchCase="'smartrules'">Smart Rules</div>
            <div *ngSwitchCase="'alarms'">Alarms</div>
            <legacy-data-explorer *ngSwitchCase="'data_explorer'">Data Explorer</legacy-data-explorer>
            <div *ngSwitchCase="'location'">Location</div>
            <dashboard-by-id *ngSwitchDefault [dashboardId]="dashboardId" [context]="context"></dashboard-by-id>
        </ng-container>
    `
})
export class AppBuilderContextDashboardComponent implements OnDestroy {
    applicationId: string;
    dashboardId: string;
    tabGroup?: string
    deviceId?: string
    deviceDetail?: string

    context: Partial<{
        id: string,
        name: string,
        type: ContextDashboardType
    }> = {}

    tabs: {
        label: string,
        icon: string,
        path: string,
        priority: number
    }[] = [];

    subscriptions = new Subscription();

    constructor(private activatedRoute: ActivatedRoute, private inventoryService: InventoryService, private applicationService: ApplicationService) {
        this.subscriptions.add(this.activatedRoute.paramMap.subscribe(async paramMap => {
            // Always defined
            this.applicationId = paramMap.get('applicationId');
            this.dashboardId = paramMap.get('dashboardId')
            // Optional
            this.tabGroup = paramMap.get('tabGroup');
            this.deviceId = paramMap.get('deviceId');
            this.deviceDetail = paramMap.get('deviceDetail');

            this.context = {
                id: this.deviceId
            }

            // TODO: check to see if applicationId + dashboardId/tabGroup has changed we don't need to reset the tabs if they haven't - it'll stop the flashing

            const tabs = [];
            this.tabs = tabs;
            if (this.deviceId) {
                tabs.push({
                    label: 'Smart rules',
                    icon: 'asterisk',
                    priority: 3,
                    path: this.createDeviceTabPath('smartrules')
                }, {
                    label: 'Alarms',
                    icon: 'bell',
                    priority: 2,
                    path: this.createDeviceTabPath('alarms')
                }, {
                    label: 'Data explorer',
                    icon: 'bar-chart',
                    priority: 1,
                    path: this.createDeviceTabPath('data_explorer')
                }, {
                    label: 'Location',
                    icon: 'location-arrow',
                    priority: 0,
                    path: this.createDeviceTabPath('location')
                })
            }
            if (this.tabGroup) {
                const app = (await this.applicationService.detail(this.applicationId)).data as IApplicationBuilderApplication;
                const dashboardsInTabgroup = app.applicationBuilder.dashboards
                    .filter(dashboard => dashboard.tabGroup === this.tabGroup && dashboard.visibility !== 'hidden')
                tabs.push(...dashboardsInTabgroup.map((dashboard, i) => ({
                    label: last(dashboard.name.split(/[/\\]/)),
                    icon: dashboard.icon,
                    priority: dashboardsInTabgroup.length - i + 1000,
                    path: this.createTabGroupTabPath(dashboard.id)
                })));
            }
            if (this.deviceId && !this.tabGroup) {
                const app = (await this.applicationService.detail(this.applicationId)).data as IApplicationBuilderApplication;
                const dashboard = app.applicationBuilder.dashboards
                    .find(dashboard => dashboard.id === this.dashboardId);
                if (dashboard) {
                    tabs.push({
                        label: last(dashboard.name.split(/[/\\]/)),
                        icon: dashboard.icon,
                        priority: 1000,
                        path: this.createDeviceTabPath()
                    });
                } else {
                    // If for some reason the user has navigated to a dashboard that isn't part of the app then add the tab anyway
                    console.warn(`Dashboard: ${this.dashboardId} isn't part of application: ${this.applicationId}`);
                    tabs.push({
                        label: 'Dashboard',
                        icon: 'th',
                        priority: 1000,
                        path: this.createDeviceTabPath()
                    });
                }
            }
        }));
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    createDeviceTabPath(deviceDetail?: string) {
        let path = `/application/${this.applicationId}`;
        if (this.tabGroup) {
            path += `/tabgroup/${this.tabGroup}`;
        }
        path += `/device/${this.deviceId}`
        if (deviceDetail) {
            path += `/${deviceDetail}`;
        }
        return path;
    }

    createTabGroupTabPath(dashboardId: string) {
        let path = `/application/${this.applicationId}`;
        path += `/tabgroup/${this.tabGroup}`;
        path += `/dashboard/${dashboardId}`;
        if (this.deviceId) {
            path += `/device/${this.deviceId}`
        }
        return path;
    }
}
