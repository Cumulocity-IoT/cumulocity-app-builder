import { Injectable, Inject } from '@angular/core';
import {ActivationEnd, Router} from '@angular/router';
import {Tab, TabFactory} from '@c8y/ngx-components';
import {AppIdService} from "../app-id.service";
import {ApplicationService, InventoryService} from "@c8y/client";
import {BehaviorSubject, combineLatest, from, Observable, of} from "rxjs";
import {distinctUntilChanged, filter, flatMap, map, switchMap, withLatestFrom} from "rxjs/operators";
import {
    SMART_RULES_AVAILABILITY_TOKEN
} from "./smart-rules-availability.upgraded-provider";

@Injectable()
export class DashboardTabs implements TabFactory {
    tabs$ = new BehaviorSubject<Tab[]>([]);

    private refreshSubject = new BehaviorSubject<void>(undefined);

    constructor(public router: Router, private appIdService: AppIdService, private appService: ApplicationService, private inventoryService: InventoryService, @Inject(SMART_RULES_AVAILABILITY_TOKEN) private c8ySmartRulesAvailability: any) {
        const tabsByTabGroup$: Observable<Map<string, Tab[]>> = combineLatest(appIdService.appIdDelayedUntilAfterLogin$, this.refreshSubject).pipe(
            map(([appId]) => appId),
            switchMap(appId => {
                if (appId) {
                    return from(this.appService.detail(appId))
                        .pipe(
                            map(res => res.data as any),
                            map(application => application.applicationBuilder.dashboards),
                            flatMap(dashboards => from(this.dashboardsToTabsMap(appId, dashboards)))
                        );
                } else {
                    return of(new Map<string, Tab[]>());
                }
            }),
        );

        const currentTabGroup$ = router.events.pipe(
            filter(event => event instanceof ActivationEnd),
            map((event: ActivationEnd) => event.snapshot.url),
            map(url => {
                if (url.length >= 4 && url[2].path === 'tabgroup') {
                    return url[3].path;
                } else {
                    return '';
                }
            }),
            distinctUntilChanged()
        );

        const currentDeviceId$ = router.events.pipe(
            filter(event => event instanceof ActivationEnd),
            map((event: ActivationEnd) => event.snapshot.url),
            map(url => {
                const deviceIdIdx = url.findIndex(pathSegment => pathSegment.path === 'device');
                if (deviceIdIdx != -1 && url.length > deviceIdIdx + 1) {
                    return url[deviceIdIdx + 1].path;
                } else {
                    return undefined;
                }
            }),
            distinctUntilChanged()
        );

        const currentUrl$ = router.events.pipe(
            filter(event => event instanceof ActivationEnd),
            map((event: ActivationEnd) => event.snapshot.url),
            map(url => '/' + url.map(pathSeg => pathSeg.path).join('/')),
            distinctUntilChanged()
        );

        combineLatest(tabsByTabGroup$, currentUrl$)
            .pipe(
                withLatestFrom(currentTabGroup$, currentDeviceId$),
                map(([[tabsByTabGroup, currentUrl], currentTabGroup, currentDeviceId]) => {
                    // Remove the /smartrules, /alarms, /dataexplorer suffix
                    const splitUrl = currentUrl.split('/');
                    if (['smartrules', 'alarms', 'dataexplorer'].includes(splitUrl[splitUrl.length-1])) {
                        splitUrl.pop();
                        currentUrl = splitUrl.join('/');
                    }

                    if (tabsByTabGroup.has(currentTabGroup)) {
                        if (currentDeviceId) {
                            return [
                                ...tabsByTabGroup.get(currentTabGroup),
                                ...this.getDeviceTabs(currentUrl)
                            ];
                        } else {
                            return tabsByTabGroup.get(currentTabGroup);
                        }
                    } else {
                        if (currentDeviceId) {
                            return [
                                ...this.getDeviceTabs(currentUrl),
                                {
                                    label: "Dashboard",
                                    path: currentUrl,
                                    priority: 1000,
                                    icon: "th",
                                }
                            ]
                        } else {
                            return [];
                        }
                    }
                })
            )
            .subscribe(this.tabs$)
    }

    getDeviceTabs(baseUrl: string) {
        const tabs = [];
        if (this.c8ySmartRulesAvailability.shouldShowLocalSmartRules()) {
            tabs.push({
                label: "Smart Rules",
                path: baseUrl + '/smartrules',
                priority: 3,
                icon: "asterisk"
            })
        }
        tabs.push({
            label: "Alarms",
            path: baseUrl + '/alarms',
            priority: 2,
            icon: "bell",
        });
        tabs.push({
            label: "Data explorer",
            path: baseUrl + '/dataexplorer',
            priority: 1,
            icon: "bar-chart",
        });
        return tabs;
    }

    get() {
        return this.tabs$;
    }

    refresh() {
        this.refreshSubject.next(undefined);
    }

    async dashboardsToTabsMap(appId: string, dashboards: any[]): Promise<Map<string, Tab[]>> {
        const tabsByTabGroup = new Map<string, Tab[]>();
        for (const [i, dashboard] of dashboards.entries()) {
            const dashboardPath = dashboard.name.split('/');
            const dashboardName = dashboardPath[dashboardPath.length-1];
            if (!dashboard.tabGroup || dashboard.visibility == 'hidden') {
                continue;
            }
            if (dashboard.groupTemplate) {
                const childAssets = (await this.inventoryService.childAssetsList(dashboard.deviceId, {pageSize: 2000, query: 'has(c8y_IsDevice)'})).data;
                for (const device of childAssets) {
                    if (!tabsByTabGroup.has(device.id)) {
                        tabsByTabGroup.set(device.id, []);
                    }
                    const tabs = tabsByTabGroup.get(device.id);
                    tabs.push({
                        path: `/application/${appId}/tabgroup/${device.id}/dashboard/${dashboard.id}/device/${device.id}`,
                        label: dashboardName,
                        icon: dashboard.icon,
                        priority: dashboards.length - i + 1000
                    });
                }
            } else {
                if (!tabsByTabGroup.has(dashboard.tabGroup)) {
                    tabsByTabGroup.set(dashboard.tabGroup, []);
                }
                let path;
                if (dashboard.deviceId) {
                    path = `/application/${appId}/tabgroup/${dashboard.tabGroup}/dashboard/${dashboard.id}/device/${dashboard.deviceId}`;
                } else {
                    path = `/application/${appId}/tabgroup/${dashboard.tabGroup}/dashboard/${dashboard.id}`;
                }
                tabsByTabGroup.get(dashboard.tabGroup).push({
                    path,
                    label: dashboardName,
                    icon: dashboard.icon,
                    priority: dashboards.length - i + 1000
                });
            }
        }
        return tabsByTabGroup;
    }
}
