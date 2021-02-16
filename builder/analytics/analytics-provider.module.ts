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
import {FormsModule} from "@angular/forms";
import {AnalyticsProviderComponent} from "./analytics-provider.component";
import {CommonModule} from "@angular/common";
import {CoreModule} from "@c8y/ngx-components";
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {NewAnalyticsProviderModalComponent} from "./new-analytics-provider-modal.component";
import { EditAnalyticsProviderModalComponent } from './edit-analytics-provider-modal.component';
import { AnalyticsProviderService } from './analytics-provider.service';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        BsDropdownModule.forRoot(),
        CoreModule,
    ],
    declarations: [
        AnalyticsProviderComponent,
        NewAnalyticsProviderModalComponent,
        EditAnalyticsProviderModalComponent
    ],
    entryComponents: [
        NewAnalyticsProviderModalComponent, EditAnalyticsProviderModalComponent
    ],
    providers: [
        AnalyticsProviderService
    ]
})
export class AnalyticsProviderModule {}
