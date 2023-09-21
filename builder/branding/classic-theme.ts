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

import { colorToHex, contrastingTextColor, lighter } from "./color-util";

export function classicTheme(branding: any) {
    const _primary_Hex = colorToHex(branding.colors.primary);
    const _lighter_primary_Hex = lighter(branding.colors.primary);
    const _active_Hex = colorToHex(branding.colors.active);
    const _text_primary_Hex = colorToHex(branding.colors.textOnPrimary);
    const _text_active_Hex = colorToHex(branding.colors.textOnActive);
    const _hover_Hex = colorToHex(branding.colors.hover);
    const _text_Hex = colorToHex(branding.colors.text);
    const _headerBar_Hex = colorToHex(branding.colors.headerBar);
    const _tabBar_Hex = colorToHex(branding.colors.tabBar);
    const _toolBar_Hex = colorToHex(branding.colors.toolBar);

    const classicTheme = `
    body {

        /* Navigator color: */
        --brand-primary: ${_primary_Hex};
        --brand-light: ${_lighter_primary_Hex};
        --navigator-active-bg: ${_active_Hex};

        /* Navigator text: */
        --navigator-text-color: ${_text_primary_Hex};
        --navigator-title-color: ${_text_primary_Hex};
        --navigator-active-color: ${_text_active_Hex};
        --navigator-hover-color: ${_hover_Hex};
      


        /* All the other text: */
        --brand-dark: ${_text_Hex};
         --header-hover-color: ${branding.colors.hover ? _hover_Hex : '#14629f'};
        --header-color: ${branding.colors.headerBar ? _headerBar_Hex : '#ffffff'};
        --dropdown-background: ${branding.colors.headerBar ? _headerBar_Hex : '#ffffff'};
        --toolbar-background:${branding.colors.toolBar ? _toolBar_Hex : '#ffffff'};
        --toolbar-color: ${_text_Hex};
        --page-tabs-background:${branding.colors.tabBar ? _tabBar_Hex : '#ffffff'};
        --toolbar-actions-color-hover: ${branding.colors.toolBar ? _hover_Hex : '#14629f'};
        --toolbar-focus-color: ${_text_Hex};
        --dropdown-actions-color-hover: ${_text_Hex};
        --component-color: ${_text_Hex};
        --component-actions-color-hover: ${_text_Hex};
        --page-tabs-link-color: ${_text_Hex};
        --page-tabs-actions-color: ${_text_Hex};
        --page-tabs-actions-color-hover: ${_text_Hex};
        --list-group-actions-color: var(--component-link-color, #000);
        --dropdown-active-color:${_active_Hex};
        --tooltip-background: ${_active_Hex};/*0b385b*/
        --tooltip-color: ${_text_active_Hex};
        ${branding.logoHeight != undefined ? '--navigator-platform-logo-height: ' + branding.logoHeight + 'px;' : ''}

        /*1017 changes */
        --header-text-color:  ${_text_Hex};
        --c8y-action-bar-color-actions:${_text_Hex};
        --c8y-action-bar-icon-color:${_text_Hex};
        --c8y-nav-tabs-color-default:${_text_Hex};
        --c8y-nav-tabs-icon-color-default:${_text_Hex};
        --c8y-action-bar-color-actions-hover:${_hover_Hex};
        --c8y-action-bar-background-default: ${_toolBar_Hex};
        --header-hover-color: ${_hover_Hex};
    
        --navigator-color-active:  ${_text_primary_Hex};
        --navigator-separator-color: ${_primary_Hex};
        --c8y-body-background-color: ${colorToHex("#f2f3f4")};
        --navigator-bg-color: ${_primary_Hex};
        --navigator-header-bg: ${_primary_Hex};
        --bf-card-bg: ${colorToHex("#fff")};
        --bf-card-color: ${colorToHex("#000")};

        }

        .header-bar {
            box-shadow: inset 0 -1px 0 0 var(--c8y-body-background-color, var(--c8y-component-border-color));
        }

        .page-tabs-horizontal .tabContainer .nav-tabs {
            background-color: var(--page-tabs-background, #fff);
            box-shadow: inset 0 -1px 0 0 var(--c8y-body-background-color, var(--c8y-component-border-color));
        }

        .page-tabs-horizontal .tabContainer .nav-tabs > div > a {
            background-color: var(--page-tabs-background, #fff);
            box-shadow: inset 0 -1px 0 0 var(--c8y-body-background-color, var(--c8y-component-border-color));
        }

        .page-tabs-horizontal .tabContainer .nav-tabs > div.active > a {
            background-color: var(--page-tabs-background, #fff);
            box-shadow: inset 0 calc(var(--c8y-nav-tabs-border-width-active) * -1) 0 0 var(--c8y-nav-tabs-border-color-active);
        }

        .navigator .title .tenant-brand {
        background-image: url(${CSS.escape(branding.logo || '')});
        padding-bottom: var(--navigator-platform-logo-height,28px);
        }

        .title .c8y-app-icon {
        ${branding.logoHeight != undefined ? '' : 'margin-top: -16px;'}
        }

       
        .btn.btn-primary {
        color: ${contrastingTextColor(branding.colors.primary)};
        background-color: var(--brand-primary);
        }
        .btn.btn-primary:active,.btn.btn-primary:active:hover {
        color: ${contrastingTextColor(branding.colors.text)};
        
        }
        .btn.btn-primary:hover,.btn.btn-primary:focus {
        color: var(--brand-primary, #1776BF);
        background-color: ${contrastingTextColor(branding.colors.primary)};
        }
        .btn-link:focus {
        /*color: ${contrastingTextColor(branding.colors.text)};*/
        }

        .body-theme {
            --body-background-color: var(--c8y-body-background-color,#fff);
        }
        .simulator-body-theme {
           --body-background-color: var(--c8y-body-background-color, #fff);
        }
        .dashboard-body-theme {
            --body-background-color: var(--c8y-body-background-color,#fff);
        }
        .label-color {
        color: var(--bf-card-color, #000);
        }
        .card-color {
        background: var(--bf-card-bg, #fff);
        color: var(--bf-card-color, #000);
        }
        .nav-tabs > li > button {
        color: var(--navigator-active-bg,#0b385b) !important;
        }
        .nav-tabs > li > button:hover:not([disabled]) {
        color: var(--brand-primary,#1776bf) !important;
        }
        select.form-control:focus, select:focus {
        color: ${_primary_Hex} !important;
        }
    `;

    return classicTheme;
}
