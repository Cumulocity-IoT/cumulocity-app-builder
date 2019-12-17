import {NgModule} from "@angular/core";

declare const angular: any;

import './cumulocity.json';

angular.module("c8y.cockpit.dataPointExplorerUI", ["c8y.cockpit.dataPointExplorer"])
    .config(["c8yViewsProvider", "gettext", (c8yViewsProvider, gettext) => {
        c8yViewsProvider.when("application/:applicationId/dashboard/:frameworkDashboardId/device/:deviceId", {
            icon: "bar-chart",
            name: gettext("Data explorer"),
            priority: 1,
            templateUrl: "./data-explorer.html",
            controller: ['c8yTitle', c8yTitle => {
                c8yTitle.changeTitle({
                    title: gettext('Data Explorer')
                });
            }]
        });
    }]);

@NgModule({})
export class DataExplorerModule {}