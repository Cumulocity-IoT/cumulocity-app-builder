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

import { colorToHex, contrastingTextColor, lighter, darker } from "./color-util";

export function standardTheme(branding: any) {
    const _primary_Hex = colorToHex(branding.colors.primary);
    const _lighter_primary_Hex = lighter(branding.colors.primary,0.5);
    const _lighter_primary_Hex_1_1 = lighter(branding.colors.primary,1.1);
    const _lighter_primary_Hex_1_2 = lighter(branding.colors.primary,1.5);
    const _darker_primary_Hex = darker(branding.colors.primary);
    const _active_Hex = colorToHex(branding.colors.active);
    const _text_primary_Hex = colorToHex(branding.colors.textOnPrimary);
    const _text_active_Hex = colorToHex(branding.colors.textOnActive);
    const _hover_Hex = colorToHex(branding.colors.hover);
    const _text_Hex = colorToHex(branding.colors.text);
    const _lighter_text_Hex = lighter(branding.colors.text);
    const _darker_text_Hex = darker(branding.colors.text);
    const _headerBar_Hex = colorToHex(branding.colors.headerBar);
    const _tabBar_Hex = colorToHex(branding.colors.tabBar);
    const _toolBar_Hex = colorToHex(branding.colors.toolBar);

    const standardTheme = `
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
        --page-tabs-background:${branding.colors.tabBar ? _tabBar_Hex : '#ffffff'};
     
        ${branding.logoHeight != undefined ? '--navigator-platform-logo-height: ' + branding.logoHeight + 'px;' : ''}

        /*1017 changes */
        --header-text-color:  ${_text_Hex};
        --c8y-headings-color:${_text_Hex};
        --c8y-action-bar-color-actions:${_text_Hex};
        --c8y-action-bar-icon-color:${_text_Hex};
        --c8y-nav-tabs-color-default:${_text_Hex};
        --c8y-nav-tabs-icon-color-active:${_text_active_Hex};
        --c8y-action-bar-color-actions-hover:${_hover_Hex};
        --c8y-action-bar-background-default: ${_toolBar_Hex};
        --header-hover-color: ${_hover_Hex};    
        --navigator-color-active:  ${_text_primary_Hex};
        --navigator-separator-color: ${_primary_Hex};
        --c8y-body-background-color: ${_darker_primary_Hex};
        --navigator-bg-color: ${_primary_Hex};
        --navigator-header-bg: ${_primary_Hex};
        --c8y-component-icon-dark-color-dark: ${_text_Hex};
        --c8y-component-background-default: ${_lighter_primary_Hex};
        --c8y-form-control-background-default:${_darker_primary_Hex};
        --c8y-form-control-color-default:${_text_Hex};
        --c8y-component-color-default:${_text_Hex};
        --c8y-component-color-actions:${_text_Hex};
        --c8y-component-background-active:  ${_lighter_primary_Hex};
        --c8y-component-form-label-color:  ${_darker_text_Hex};
        --c8y-component-background-odd:  ${_primary_Hex};
        --c8y-component-background-expanded:${_darker_primary_Hex}; //Need a higher color
        --c8y-page-sticky-header-background-default: ${_lighter_primary_Hex};
        --c8y-form-label-color: ${_text_Hex};
        --c8y-component-color-link: ${_darker_text_Hex};
        --c8y-component-icon-color: ${_darker_text_Hex};
        --c8y-nav-tabs-background-default:  ${_lighter_primary_Hex};
        --c8y-form-control-background-focus:  ${_lighter_primary_Hex};
        --c8y-form-control-color-focus:${_text_Hex};
        --c8y-alert-background-default: ${_lighter_primary_Hex};
        --c8y-alert-color-default:${_text_Hex};
        --c8y-component-realtime-added: ${_darker_primary_Hex};
        --c8y-component-spinner-color:${_lighter_text_Hex};
        --c8y-component-color-text-muted: ${_text_Hex};
        --c8y-component-background-hover: ${_lighter_primary_Hex_1_1};

        --c8y-level-0: ${_lighter_primary_Hex};
        --c8y-level-1-custom: ${_lighter_primary_Hex_1_1};
        --c8y-level-2-custom: ${_lighter_primary_Hex_1_2};

        

        /* Widget specific */
        --component-color: ${_text_Hex};
        --card-color: ${_text_Hex};
        --card-background: ${_lighter_primary_Hex};
        --component-background: ${_lighter_primary_Hex};
        --component-label-color:${_darker_text_Hex};   
        --component-active-background: ${_primary_Hex};

        --dropdown-background: ${branding.colors.headerBar ? _headerBar_Hex : '#ffffff'};
        --toolbar-background:${branding.colors.toolBar ? _toolBar_Hex : '#ffffff'};
        --toolbar-color: ${_text_Hex};
        --toolbar-actions-color-hover: ${branding.colors.toolBar ? _hover_Hex : '#14629f'};
        --toolbar-focus-color: ${_text_Hex};
        --dropdown-actions-color-hover: ${_text_Hex};
        --component-actions-color-hover: ${_text_Hex};
        --page-tabs-link-color: ${_text_Hex};
        --page-tabs-actions-color: ${_text_Hex};
        --page-tabs-actions-color-hover: ${_text_Hex};
        --list-group-actions-color: var(--component-link-color, #000);
        --dropdown-active-color:${_active_Hex};
        --tooltip-background: ${_active_Hex};/*0b385b*/
        --tooltip-color: ${_text_active_Hex};

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
        
        .btn-group .btn {
            background-color: transparent;
        }

        .btn-default {
            background-color: inherit;
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
            color: var(--navigator-active-color, #000);
        }
        .card-color {
            background: var(--brand-light, #fff);
            color: var(--navigator-active-color, #000);
        }
        .dashboard-grid .card-dashboard  .bg-level-0 {
            background-color: var(--brand-light, var(--c8y-level-0))!important;
        }       
            
        .app-switcher-dropdown-menu{
            border: none !important;
        }
        .dashboard-grid .card-dashboard  .navbar-default {
            background-color: inherit;
        }
        
       
        .dashboard-grid .card-dashboard .form-control {
            background-color: var(--card-background, var(--c8y-component-background-default)) !important;
            color: var(--card-color, #000) !important;
        }
      
        label {
            color: var(--component-label-color) !important;
        }
        
        [datepicker] table, [uib-datepicker] table, [uib-daypicker] table {
            background-color: var(--c8y-root-component-background-default, #fff);
            color:var(--c8y-root-component-color-default, #fff);
        }
        [datepicker] table .text-muted , [uib-datepicker] table .text-muted , [uib-daypicker] table .text-muted {
            color: var(--component-label-color);
        }
        .bg-inherit {
            background-color: var(--card-background, var(--c8y-component-background-default)) !important;
        }
        .bg-level-1 {
            background-color: var(--c8y-level-1-custom) !important;
        }
        .bg-level-2 {
            background-color: var(--c8y-level-2-custom) !important;
        }
        .ng-select .ng-select-container{            
            background-color: var(--c8y-form-control-background-default) !important;
            color: var(--component-color) !important;
        }
        .ng-dropdown-panel .ng-dropdown-panel-items .ng-option{
            background-color: var(--c8y-form-control-background-default) !important;
            color: var(--component-label-color) !important;
        }
        .ng-dropdown-panel .ng-dropdown-panel-items .ng-option.ng-option-marked {
            color: var(--component-color) !important;
        }
        .ng-dropdown-panel .ng-dropdown-panel-items .ng-option.ng-option-selected, .ng-dropdown-panel .ng-dropdown-panel-items .ng-option.ng-option-selected.ng-option-marked{
            color: var(--component-color) !important;
        }
        .ng-select.ng-select-multiple .ng-select-container .ng-value-container .ng-input > input {
            color: var(--c8y-form-control-color-default) !important;
        }
         
        .c8y-wizard-form {
            background-color:inherit;
        }
        .form-read-only .form-group label {
            color: var(--component-label-color) !important;
        }    

        .app-noicon {
            color: var(--brand-primary);
        }
        .c8y-switch input[type=checkbox]+span:after {
            background-color: var(--component-label-color) !important;
        }
        .range-display__range__current {
            border-top: 2px solid var(--brand-dark, var(--brand-light, var(--c8y-brand-light)));
        }
        .range-display--vertical .range-display__range__current {
            border-left: 2px solid var(--brand-dark, var(--brand-light, var(--c8y-brand-light)));
        }
        .input-group-addon {
            background-color:inherit !important;
        }
        .uib-weeks .h6, .bs-datepicker-body table td.week span {
            color: var(--component-label-color);
        }

        .bs-datepicker, .bs-datepicker-body table  {
            background-color: var(--c8y-root-component-background-default, #fff);
            color: var(--c8y-root-component-color-default, #fff);
        }
        .bs-datepicker-body table td, .bs-datepicker-body table th {
            color: var(--c8y-root-component-color-default, #fff) !important;
        }
        .bs-datepicker-head button {
            color: var(--brand-primary);   
        }
    `;

    return standardTheme;
}
