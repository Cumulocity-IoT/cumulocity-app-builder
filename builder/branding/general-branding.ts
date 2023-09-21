/*
* Copyright (c) 2023 Software AG, Darmstadt, Germany and/or its licensors
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
import * as fa from "fontawesome";

export function generalBranding(app: any) {
    const commonBranding =  `
    .title .c8y-app-icon i {
        display: none;
    }
    .title .c8y-app-icon {
        margin-top: -16px;
    }
    .title .c8y-app-icon::before {
        font-family: "FontAwesome";
        content: "${fa(app.applicationBuilder.icon)}";
        font-size: ${app.applicationBuilder.branding && app.applicationBuilder.branding.enabled && app.applicationBuilder.branding.hideIcon ? '0' : 'var(--navigator-app-icon-size, 46px)'};
    }
    .title .c8y-app-icon::after {
        content: '${CSS.escape(app.name)}';
        display: block;
        margin-top: -6px;
        padding-left: 5px;
        padding-right: 5px;
        white-space: pre-wrap;
    }
    .title span {
        display: none;
    }
    
    .app-main-header .app-view::before {
      font-family: "FontAwesome";
      content: "${fa(app.applicationBuilder.icon)}";
      font-size: 2em;
      width: 32px;
      transform: scale(1);
      margin-left: 0.5em;
      transition: all .4s ease-in-out;
    }
    .app-main-header.open .app-view::before {
      width: 0;
      transform: scale(0);
      margin-left: 0;
    }
    .app-main-header .app-view c8y-app-icon  {
      display: none;
    }
    
    .navigatorContent .link.active {
        border-left-color: var(--navigator-active-color);
    }
    
    
    .dashboard.dashboard-theme-branded .c8y-empty-state a {
        color: var(--link-color,var(--c8y-component-color-link,var(--c8y-root-component-color-link)));
    }

    .ng-select.ng-select-single .ng-select-container .ng-value-container {
        color: var(--c8y-form-control-color-default) !important;
    }
    `;

    
    
    return commonBranding;
}