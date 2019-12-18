import {NgModule} from "@angular/core";
import {downgradeInjectable} from "@angular/upgrade/static";
import {InventoryService} from "@c8y/client";
import {AppStateService} from "@c8y/ngx-components";
import {DashboardController} from "./dashboard.controller";

import './cumulocity.json';

declare const angular: any;

angular
    .module('framework', [])
    .config(['c8yViewsProvider', c8yViewsProvider => {
        const paths = [
            'application/:applicationId/dashboard/:frameworkDashboardId',
            'application/:applicationId/dashboard/:frameworkDashboardId/device/:deviceId'
        ];
        paths.forEach((path) => {
            c8yViewsProvider.when(path, {
                priority: 1000,
                name: "Dashboard",
                icon: "th",
                template: '<framework-dashboard/>'
            });
        });
    }])
    .factory('inventoryService', downgradeInjectable(InventoryService))
    .factory('appStateService', downgradeInjectable(AppStateService));

angular
    .module('framework')
    .component('frameworkDashboard', {
        template: `<c8y-dashboard-gridstack id="vm.dashboardId" is-frozen="false"/>`,
        controllerAs: 'vm',
        controller: [
            '$routeParams',
            'c8yTitle',
            'inventoryService',
            'appStateService',
            DashboardController
        ]
    });

@NgModule({})
export class DashboardModule {}