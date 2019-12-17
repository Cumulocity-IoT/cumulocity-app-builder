import {NgModule} from "@angular/core";

declare const angular: any;

import './cumulocity.json';

angular.module("c8y.smartRulesUI", ["c8y.smartRules"])
    .config(["c8yViewsProvider", "gettext", function(c8yViewsProvider, gettext) {
        c8yViewsProvider.when("application/:applicationId/dashboard/:frameworkDashboardId/device/:deviceId", {
            priority: 100,
            name: gettext("Smart Rules"),
            icon: "asterisk",
            showIf: ["c8ySmartRulesAvailability", function(c8ySmartRulesAvailability) {
                return c8ySmartRulesAvailability.shouldShowLocalSmartRules()
            }],
            templateUrl: "./smart-rules.html",
            controller: ['c8yTitle', c8yTitle => {
                c8yTitle.changeTitle({
                    title: gettext('Smart Rules')
                });
            }]
        })
    }]);

angular.module("c8y.cockpit.config", []);

@NgModule({})
export class SmartRulesModule {}