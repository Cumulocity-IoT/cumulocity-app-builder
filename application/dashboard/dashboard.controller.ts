import {filter, first, switchMap} from "rxjs/operators";
import {from} from "rxjs";
import {InventoryService} from "@c8y/client";
import {AppStateService} from "@c8y/ngx-components";

export class DashboardController {
    dashboardId: string;

    constructor($routeParams, c8yTitle, inventoryService: InventoryService, appStateService: AppStateService) {
        this.dashboardId = $routeParams.frameworkDashboardId;

        // Wait for the user to log in before sending the first request
        appStateService.currentUser
            .pipe(
                filter(user => user != null),
                first(),
                switchMap(() => from(inventoryService.detail(this.dashboardId).then(result => result.data)))
            )
            .subscribe(dashboard => {
                c8yTitle.changeTitle({
                    title: dashboard.c8y_Dashboard.name
                });
            });
    }
}