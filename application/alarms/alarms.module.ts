import {NgModule} from "@angular/core";

declare const angular: any;

import './cumulocity.json';

angular.module("c8y.parts.alarmList", [])
    .config(["c8yNavigatorProvider", "c8yViewsProvider", "gettext", function(c8yNavigatorProvider, c8yViewsProvider, gettext) {
        c8yViewsProvider.when("application/:applicationId/dashboard/:frameworkDashboardId/device/:deviceId", {
            name: gettext("Alarms"),
            priority: 10,
            icon: "bell",
            templateUrl: "./alarms.html"
        })
    }]);

import '@c8y/ng1-modules/devicemanagement-alarmList/controllers/alarmList.js'

@NgModule({})
export class AlarmsModule {}