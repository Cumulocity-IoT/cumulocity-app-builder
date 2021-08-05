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

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CoreModule, HOOK_TABS } from '@c8y/ngx-components';
import { WidgetCatalogComponent } from './widget-catalog.component';
import { RectangleSpinnerModule } from "../builder/utils/rectangle-spinner/rectangle-spinner.module";
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { WidgetCatalogService } from './widget-catalog.service';
import {WidgetCatalogTabFactory} from './widget-catalog.tabfactory';
import { RouterModule, Routes } from '@angular/router';
import { SortableModule } from 'ngx-bootstrap/sortable';
import { previewModalComponent } from './preview-modal/preview.-modal.component';

const routes: Routes = [
    {
        path: 'widget-catalog',
        redirectTo: 'widget-catalog/my-widgets'
    },
    {
        path: 'widget-catalog/my-widgets',
        component: WidgetCatalogComponent
    },
    {
        path: 'widget-catalog/get-widgets',
        component: WidgetCatalogComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
        CoreModule,
        FormsModule,
        RectangleSpinnerModule,
        ButtonsModule.forRoot(),
        SortableModule.forRoot(),
    ],
    declarations: [
        WidgetCatalogComponent,
        previewModalComponent
    ],
    entryComponents: [WidgetCatalogComponent, previewModalComponent],
    providers: [
        WidgetCatalogService,
        {
            provide: HOOK_TABS, useClass: WidgetCatalogTabFactory, multi: true
        }
    ]
})
export class WidgetCatalogModule {}