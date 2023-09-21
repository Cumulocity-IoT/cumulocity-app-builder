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

import { Injectable } from "@angular/core";
import * as fa from "fontawesome";
import * as delay from "delay";
import { SettingsService } from "../settings/settings.service";
import {colorToHex} from "./color-util";
import { generalBranding } from "./general-branding";
import { customLogo } from "./custom-logo";
import { classicTheme } from "./classic-theme";
import { standardTheme } from "./standard-theme";
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
            this.appGeneral.innerText =  generalBranding(app);
            if (app.applicationBuilder.branding && app.applicationBuilder.branding.enabled){
                const selectedTheme = app.applicationBuilder.selectedTheme;
                const color = app.applicationBuilder.branding.colors;
                switch (selectedTheme) {
                    case "Default":
                        this.loadFaviconURL(true, '#1776BF', app.applicationBuilder.icon);
                        this.appBranding.innerText = customLogo(app.applicationBuilder.branding);
                        break;
                
                    case "Classic":    
                        this.loadFaviconURL(true, color.primary, app.applicationBuilder.icon);
                        this.appBranding.innerText = classicTheme(app.applicationBuilder.branding);
                        break;

                    default:

                        this.loadFaviconURL(true, color.primary, app.applicationBuilder.icon);
                        this.appBranding.innerText = standardTheme(app.applicationBuilder.branding);
                        break;
                }
            } else {
                this.loadFaviconURL(false, null, app.applicationBuilder.icon);
                this.appBranding.innerText = '';
            }
        } else {
            this.favicon.removeAttribute('type');
            this.favicon.setAttribute('href', 'favicon.ico');
            this.appBranding.innerText = '';
        }
    }

    private async loadFaviconURL(isBrandingEnabled: boolean, color: string, icon: any) {
        await delay(1000);
        if (isBrandingEnabled && color) {
            const faviconUrl = this.createFaviconUrl(color, icon);
            this.favicon.setAttribute('type', 'image/png');
            this.favicon.setAttribute('href', faviconUrl);
        } else {
            const faviconUrl = this.createFaviconUrl('#1776BF', icon);
            this.favicon.setAttribute('type', 'image/png');
            this.favicon.setAttribute('href', faviconUrl);
        }


    }
    createFaviconUrl(primaryColor: string, icon: string): string {
        const color = colorToHex(primaryColor);
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
