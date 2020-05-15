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

import {NgModule} from "@angular/core";
import {NgSelectModule} from "@ng-select/ng-select";
import {IconSelectorComponent} from "./icon-selector.component";
import {FormsModule} from "@angular/forms";
import {CoreModule} from "@c8y/ngx-components";

@NgModule({
    imports: [
        NgSelectModule,
        FormsModule,
        CoreModule
    ],
    declarations: [
        IconSelectorComponent
    ],
    exports: [
        IconSelectorComponent
    ]
})
export class IconSelectorModule {}