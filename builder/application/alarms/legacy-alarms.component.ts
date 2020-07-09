/*
* Copyright (c) 2019 Software AG, Darmstadt, Germany and/or its licensors
*
* SPDX-License-Identifier: Apache-2.0
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
 */
import { Directive, ElementRef, Injector } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';

declare const angular: any;

/*
* Copyright (c) 2019 Software AG, Darmstadt, Germany and/or its licensors
*
* SPDX-License-Identifier: Apache-2.0
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
 */
import './cumulocity.json';

angular.module("c8y.parts.alarmList", [])
    // Use a directive rather than a component so that we can hack the $routeParams before the template is constructed
    .directive('legacyAlarms', ['$routeParams', 'c8yUiUtil', function ($routeParams, c8yUiUtil) {
        return {
            restrict: 'E',
            template: require("@c8y/ng1-modules/devicemanagement-alarmList/views/index.html").default,
            controller: function() {},
            controllerAs: '$ctrl'
        }
    }]);

import '@c8y/ng1-modules/devicemanagement-alarmList/controllers/alarmList.js'

@Directive({
    selector: 'legacy-alarms'
})
export class LegacyAlarmsComponent extends UpgradeComponent {
    constructor(elementRef: ElementRef, injector: Injector) {
        // Get the AngularJS Injector
        // noinspection JSDeprecatedSymbols
        const $injector = injector.get('$injector');
        $injector.invoke(['c8yUiUtil', '$routeParams', function(c8yUiUtil, $routeParams) {
            // Set the context device/group for this component
            const context = c8yUiUtil.getContext();
            if (context.context === 'device') {
                $routeParams.deviceId = context.id;
            } else if (context.context != null) {
                $routeParams.groupId = context.id;
            }
        }]);

        super('legacyAlarms', elementRef, injector);
    }
}
