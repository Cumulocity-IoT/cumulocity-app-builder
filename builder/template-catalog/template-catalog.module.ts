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

import { NgModule } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule, CoreModule } from '@c8y/ngx-components';
import { TemplateCatalogModalComponent } from "./template-catalog.component";
import { TemplateCatalogService } from "./template-catalog.service";
import { IconSelectorModule } from "../../icon-selector/icon-selector.module";
import { RectangleSpinnerModule } from "../utils/rectangle-spinner/rectangle-spinner.module";
import { DeviceSelectorModalModule } from "../utils/device-selector-modal/device-selector.module";
import { TemplateUpdateModalComponent } from "./template-update.component";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        CoreModule,
        IconSelectorModule,
        RectangleSpinnerModule,
        DeviceSelectorModalModule
    ],
    declarations: [
        TemplateCatalogModalComponent,
        TemplateUpdateModalComponent
    ],
    entryComponents: [
        TemplateCatalogModalComponent,
        TemplateUpdateModalComponent
    ],
    providers: [
        TemplateCatalogService
    ]
})
export class TemplateCatalogModule { }