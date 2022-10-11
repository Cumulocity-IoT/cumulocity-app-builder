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

import { Injectable } from "@angular/core";
import * as fa from "fontawesome";
import * as d3 from "d3-color";
import * as delay from "delay";
import { SettingsService } from "../settings/settings.service";
declare const FontFace: any;

/**
 * Adds style elements to the head which set the css variables required to re-theme cumulocity
 * Also deals with css required for icons, the app name, favicon etc
 */
@Injectable()
export class BrandingService {
    appGeneral: HTMLStyleElement;
    appBranding: HTMLStyleElement;
    powerByBlock: HTMLStyleElement;
    favicon: HTMLLinkElement;

    fontAwesomeLoaded: Promise<void>;
    isFontAwesomeLoaded: boolean = false;

    private isNavlogoVisible = true;
    constructor(private settingService: SettingsService) {
        this.appGeneral = document.createElement('style');
        this.appBranding = document.createElement('style');
        this.powerByBlock = document.createElement('style');
        document.head.appendChild(this.appGeneral);
        document.head.appendChild(this.appBranding);
        document.head.appendChild(this.powerByBlock);
        this.settingService.isNavlogoVisible().then(isVisible => {
            this.isNavlogoVisible = isVisible;
            this.updatePowerbyLogo(this.isNavlogoVisible);
        });

        this.favicon = document.head.querySelector('[rel=icon]');

        if (typeof FontFace != 'undefined') {
            // this.fontAwesomeLoaded = new FontFace('FontAwesome', 'url(./fontawesome-webfont-20fd1704ea223900efa9fd4e869efb08.woff2)').load();
            this.fontAwesomeLoaded = new FontFace('FontAwesome', 'url(./fonts/fontawesome-webfont.woff2)').load();
        } else {
            this.fontAwesomeLoaded = Promise.resolve();
        }

        this.fontAwesomeLoaded.then(() => {
            this.isFontAwesomeLoaded = true;
        });
    }

    updateStyleForApp(app) {
        // If font awesome is not loaded then refresh the view when it loads - so that the favicon can be loaded properly
        if (!this.isFontAwesomeLoaded) {
            this.fontAwesomeLoaded.then(() => {
                this.updateStyleForApp(app);
            });
        }
        this.updatePowerbyLogo(this.isNavlogoVisible);
        if (app && app.applicationBuilder) {
            this.appGeneral.innerText = `
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


`;
            // The below if condition works only when primary color is white
            if (app.applicationBuilder.branding && app.applicationBuilder.branding.enabled && app.applicationBuilder.branding.colors
                && (app.applicationBuilder.branding.colors.primary === '#ffffff' || app.applicationBuilder.branding.colors.primary === '#fff' || app.applicationBuilder.branding.colors.primary === 'white')) {
                this.loadFaviconURL(app);

                this.appBranding.innerText = `
body {
    
    /* Navigator color: */
    --brand-primary: ${this.colorToHex(app.applicationBuilder.branding.colors.primary)};
    --brand-light: ${this.lighter(app.applicationBuilder.branding.colors.primary)};
    --navigator-active-bg: ${this.colorToHex(app.applicationBuilder.branding.colors.active)};
    
    /* Navigator text: */
    --navigator-text-color: ${this.colorToHex(app.applicationBuilder.branding.colors.textOnPrimary)};
    --navigator-title-color: ${this.colorToHex(app.applicationBuilder.branding.colors.textOnPrimary)};
    --navigator-active-color: ${this.colorToHex(app.applicationBuilder.branding.colors.textOnActive)};
    --navigator-hover-color: ${this.colorToHex(app.applicationBuilder.branding.colors.hover)};
    

    /* All the other text: */
    --brand-dark: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    /* --input-focus-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)}; */
    --header-hover-color: ${this.colorToHex(app.applicationBuilder.branding.colors.hover)};
    --header-color: ${app.applicationBuilder.branding.colors.headerBar ? this.colorToHex(app.applicationBuilder.branding.colors.headerBar) : '#ffffff'};
    --dropdown-background: ${app.applicationBuilder.branding.colors.headerBar ? this.colorToHex(app.applicationBuilder.branding.colors.headerBar) : '#ffffff'};
    --toolbar-background:${app.applicationBuilder.branding.colors.toolBar ? this.colorToHex(app.applicationBuilder.branding.colors.toolBar) : '#ffffff'};
    --toolbar-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --page-tabs-background:${app.applicationBuilder.branding.colors.tabBar ? this.colorToHex(app.applicationBuilder.branding.colors.tabBar) : '#ffffff'};
    --toolbar-actions-color-hover: ${app.applicationBuilder.branding.colors.toolBar ? this.colorToHex(app.applicationBuilder.branding.colors.hover) : '#ffffff'};
    --toolbar-focus-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --dropdown-actions-color-hover: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --component-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --component-actions-color-hover: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --page-tabs-link-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --page-tabs-actions-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --page-tabs-actions-color-hover: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --list-group-actions-color: var(--component-link-color, #000);
    --dropdown-active-color:${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --tooltip-background: ${this.colorToHex(app.applicationBuilder.branding.colors.active)};/*0b385b*/
    --tooltip-color: ${this.colorToHex(app.applicationBuilder.branding.colors.textOnActive)};
    --link-color: #1776BF;
    --link-color-hover: #1776BF;
    --page-tabs-active-color: #1776BF;
    --input-focus-border-color: #ccd2d6;
    --list-group-actions-color-hover: var(--component-link-color, #000);
    ${app.applicationBuilder.branding.logoHeight != undefined ? '--navigator-platform-logo-height: ' + app.applicationBuilder.branding.logoHeight + 'px;' : ''}
}


.spinner > div {
    background-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
}


.navigator .title .tenant-brand {
    background-image: url(${CSS.escape(app.applicationBuilder.branding.logo || '')});
}

.title .c8y-app-icon {
    ${app.applicationBuilder.branding.logoHeight != undefined ? '' : 'margin-top: -16px;'}
}

.btn.btn-primary {
    color: ${this.contrastingTextColor(app.applicationBuilder.branding.colors.primary)};
    border-color: var(--brand-dark);
}
.btn.btn-primary:active,.btn.btn-primary:active:hover {
    color: ${this.contrastingTextColor(app.applicationBuilder.branding.colors.text)};
}
.btn.btn-primary:hover,.btn.btn-primary:focus {
    color: var(--brand-dark);
}
.btn-default,.btn-default:focus,.btn-default:hover {
    color: var(--brand-dark);
    border-color: var(--brand-dark);
}
.btn-link,.btn-link:hover,.btn-link:focus {
    color: var(--brand-dark);
}
.body-theme {
    background: linear-gradient(0deg,rgba(0,0,0,0.43),rgba(0,0,0,0.43)) var(--brand-dark,#f2f3f4);
    --body-background-color: var(--brand-dark,#f2f3f4);
}
.simulator-body-theme {
   background: linear-gradient(0deg, rgba(0, 0, 0, 0.43), rgba(0, 0, 0, 0.43)) var(--brand-dark, #f2f3f4);
  --body-background-color: var(--brand-dark, #f2f3f4);
}
.dashboard-body-theme {
    background: linear-gradient(0deg,rgba(0,0,0,0.43),rgba(0,0,0,0.43)) var(--brand-dark,#f2f3f4);
    --body-background-color: var(--brand-dark,#f2f3f4);
}
.label-color {
    color: var(--navigator-active-color, #000);
}
.card-color {
    background: var(--brand-primary, #fff);
    color: var(--navigator-active-color, #000);
}
.nav-tabs > li > button {
    color: var(--navigator-active-bg,#0b385b);
}
.nav-tabs > li > button:hover:not([disabled]) {
    color: var(--brand-primary,#1776bf);
}
select.form-control:focus, select:focus {
    color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
}
label.c8y-checkbox input[type='checkbox']:checked + span::after, label.c8y-radio input[type='checkbox']:checked + span::after {
    color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
}
label.c8y-radio input[type='radio']:checked + span::after {
    background-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
}
.c8y-switch input:checked + span:before {
    background-color: ${this.lighter(app.applicationBuilder.branding.colors.text)};
}
.add-card, .card.add-card {
    color: var(--brand-dark);
}
.pagination>.active>a {
    color: var(--brand-dark) !important;
    border-color: #b0b9bf !important;
}
.deviceSelectorCombo .selectedDevice {
    color: var(--brand-dark);
}
.btn-clean:focus, .btn-clean:hover {
    color: var(--brand-dark);
}
.text-primary {
    color: var(--brand-dark);
}
td a {
    color: #00f !important;
}
.c8y-wizard .modal-header {
    color: var(--brand-dark) !important;    
}
`;
            } else if (app.applicationBuilder.branding && app.applicationBuilder.branding.enabled && app.applicationBuilder.branding.colors) {
                this.loadFaviconURL(app);

                this.appBranding.innerText = `
body {
    
    /* Navigator color: */
    --brand-primary: ${this.colorToHex(app.applicationBuilder.branding.colors.primary)};
    --brand-light: ${this.lighter(app.applicationBuilder.branding.colors.primary)};
    --navigator-active-bg: ${this.colorToHex(app.applicationBuilder.branding.colors.active)};
    
    /* Navigator text: */
    --navigator-text-color: ${this.colorToHex(app.applicationBuilder.branding.colors.textOnPrimary)};
    --navigator-title-color: ${this.colorToHex(app.applicationBuilder.branding.colors.textOnPrimary)};
    --navigator-active-color: ${this.colorToHex(app.applicationBuilder.branding.colors.textOnActive)};
    --navigator-hover-color: ${this.colorToHex(app.applicationBuilder.branding.colors.hover)};
    

    /* All the other text: */
    --brand-dark: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    /* --input-focus-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)}; */
    --header-hover-color: ${this.colorToHex(app.applicationBuilder.branding.colors.hover)};
    --header-color: ${app.applicationBuilder.branding.colors.headerBar ? this.colorToHex(app.applicationBuilder.branding.colors.headerBar) : '#ffffff'};
    --dropdown-background: ${app.applicationBuilder.branding.colors.headerBar ? this.colorToHex(app.applicationBuilder.branding.colors.headerBar) : '#ffffff'};
    --toolbar-background:${app.applicationBuilder.branding.colors.toolBar ? this.colorToHex(app.applicationBuilder.branding.colors.toolBar) : '#ffffff'};
    --toolbar-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --page-tabs-background:${app.applicationBuilder.branding.colors.tabBar ? this.colorToHex(app.applicationBuilder.branding.colors.tabBar) : '#ffffff'};
    --toolbar-actions-color-hover: ${app.applicationBuilder.branding.colors.toolBar ? this.colorToHex(app.applicationBuilder.branding.colors.hover) : '#ffffff'};
    --toolbar-focus-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --dropdown-actions-color-hover: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --component-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --component-actions-color-hover: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --page-tabs-link-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --page-tabs-actions-color: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --page-tabs-actions-color-hover: ${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --list-group-actions-color: var(--component-link-color, #000);
    --dropdown-active-color:${this.colorToHex(app.applicationBuilder.branding.colors.text)};
    --tooltip-background: ${this.colorToHex(app.applicationBuilder.branding.colors.active)};/*0b385b*/
    --tooltip-color: ${this.colorToHex(app.applicationBuilder.branding.colors.textOnActive)};
    ${app.applicationBuilder.branding.logoHeight != undefined ? '--navigator-platform-logo-height: ' + app.applicationBuilder.branding.logoHeight + 'px;' : ''}
}


.navigator .title .tenant-brand {
    background-image: url(${CSS.escape(app.applicationBuilder.branding.logo || '')});
}

.title .c8y-app-icon {
    ${app.applicationBuilder.branding.logoHeight != undefined ? '' : 'margin-top: -16px;'}
}

.btn.btn-primary {
    color: ${this.contrastingTextColor(app.applicationBuilder.branding.colors.primary)};
}
.btn.btn-primary:active,.btn.btn-primary:active:hover {
    color: ${this.contrastingTextColor(app.applicationBuilder.branding.colors.text)};
}
.btn.btn-primary:hover,.btn.btn-primary:focus {
    color: var(--brand-primary, #1776BF);
}
.btn-link:focus {
    color: ${this.contrastingTextColor(app.applicationBuilder.branding.colors.text)};
}

.body-theme {
    background: linear-gradient(0deg,rgba(0,0,0,0.43),rgba(0,0,0,0.43)) var(--brand-primary,#f2f3f4);
    --body-background-color: var(--brand-primary,#f2f3f4);
}
.simulator-body-theme {
   background: linear-gradient(0deg, rgba(0, 0, 0, 0.43), rgba(0, 0, 0, 0.43)) var(--brand-primary, #f2f3f4);
  --body-background-color: var(--brand-primary, #f2f3f4);
}
.dashboard-body-theme {
    background: linear-gradient(0deg,rgba(0,0,0,0.43),rgba(0,0,0,0.43)) var(--brand-primary,#f2f3f4);
    --body-background-color: var(--brand-primary,#f2f3f4);
}
.label-color {
    color: var(--navigator-active-color, #000);
}
.card-color {
    background: var(--brand-primary, #fff);
    color: var(--navigator-active-color, #000);
}
.nav-tabs > li > button {
    color: var(--navigator-active-bg,#0b385b);
}
.nav-tabs > li > button:hover:not([disabled]) {
    color: var(--brand-primary,#1776bf);
}
select.form-control:focus, select:focus {
    color: ${this.colorToHex(app.applicationBuilder.branding.colors.primary)};
}
`;
            } else {
                /*  const faviconUrl = this.createFaviconUrl('#1776BF', app.applicationBuilder.icon);
                 this.favicon.setAttribute('type', 'image/png');
                 this.favicon.setAttribute('href', faviconUrl); */
                this.loadFaviconURL(app);

                this.appBranding.innerText = '';
            }
        } else {
            this.favicon.removeAttribute('type');
            this.favicon.setAttribute('href', 'favicon.ico');

            this.appGeneral.innerText = `
.title span::after {
    content: "V${__VERSION__}";
    display: block;
    font-size: small;
}
`;
            this.appBranding.innerText = '';
        }
    }

    colorToHex(color: string): string {
        try {
            return d3.color(color).hex();
        } catch (e) {
            return 'white'
        }
    }

    lighter(color: string): string {
        try {
            return d3.color(color).brighter().hex()
        } catch (e) {
            return 'white'
        }
    }

    contrastingTextColor(primaryColor: string): string {
        try {
            const color = d3.color(primaryColor).rgb();
            // Formula from Gacek: https://stackoverflow.com/a/1855903/11530669
            return (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255 > 0.5 ? 'black' : 'white';
        } catch (e) {
            return 'white';
        }
    }

    private async loadFaviconURL(app) {
        await delay(1000);
        if (app.applicationBuilder.branding && app.applicationBuilder.branding.enabled && app.applicationBuilder.branding.colors) {
            const faviconUrl = this.createFaviconUrl(app.applicationBuilder.branding.colors.primary, app.applicationBuilder.icon);
            this.favicon.setAttribute('type', 'image/png');
            this.favicon.setAttribute('href', faviconUrl);
        } else {
            const faviconUrl = this.createFaviconUrl('#1776BF', app.applicationBuilder.icon);
            this.favicon.setAttribute('type', 'image/png');
            this.favicon.setAttribute('href', faviconUrl);
        }


    }
    createFaviconUrl(primaryColor: string, icon: string): string {
        const color = this.colorToHex(primaryColor);
        const canvas = document.createElement('canvas');
        canvas.height = 16;
        canvas.width = 16;
        const context = canvas.getContext('2d');
        context.font = '16px FontAwesome';
        context.textBaseline = 'top';
        context.textAlign = 'left';
        context.fillStyle = color;
        context.fillText(fa(icon), 0, 0, 16);
        return canvas.toDataURL();
    }

    private updatePowerbyLogo(isLogoVisible: boolean) {
        if (isLogoVisible) {
            this.powerByBlock.innerText = `
            .powered-by {
                display: block;
            }
            `
        } else {
            this.powerByBlock.innerText = `
            .powered-by {
                display: none;
            }
            `
        }
    }
}
