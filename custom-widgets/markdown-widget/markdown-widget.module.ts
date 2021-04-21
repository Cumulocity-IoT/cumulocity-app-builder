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

import { NgModule } from '@angular/core';
import { HOOK_COMPONENTS, CoreModule } from '@c8y/ngx-components';

import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { MarkdownWidgetComponent } from './markdown-widget.component';
import { MarkdownConfigComponent } from './markdown-widget.config';
import * as preview from './markdown-preview-image';
@NgModule({
  declarations: [MarkdownWidgetComponent, MarkdownConfigComponent],
  imports: [
    FormsModule,
    CoreModule,
    MarkdownModule.forRoot(),
  ],
  exports: [MarkdownWidgetComponent, MarkdownConfigComponent],
  entryComponents: [MarkdownWidgetComponent, MarkdownConfigComponent],
  providers: [
    {
    provide: HOOK_COMPONENTS,
    multi: true,
    useValue: {
        id: 'markdown.widget.default',
        label: 'Markdown',
        description: 'Display Markdown Documentation',
        previewImage: preview.previewImage,
        component: MarkdownWidgetComponent,
        configComponent: MarkdownConfigComponent,
        data: {
            ng1: {
                options: {
                noDeviceTarget: true,
                noNewWidgets: false,
                deviceTargetNotRequired: true,
                groupsSelectable: false
                }
            }
        }
    }
  }]
})
export class MarkdownWidgetModule { }
