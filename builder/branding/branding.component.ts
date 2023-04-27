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

import { Component, Inject, OnDestroy, OnInit, Renderer2 } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ApplicationService } from "@c8y/client";
import { map, switchMap, tap } from "rxjs/operators";
import { from, Observable, Subscription } from "rxjs";
import { BrandingService } from "./branding.service";
import { DOCUMENT } from "@angular/common";
import { CustomBrandingComponent } from "./custom-branding.component";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { cloneDeep } from "lodash-es";
import { AppDataService } from "../app-data.service";

@Component({
    templateUrl: './branding.component.html'
})
export class BrandingComponent implements OnDestroy {
    app: Observable<any>;
    dirty = false;
    showIcon = true;
    applyTheme = false;
    bsModalRef: BsModalRef;
    themeName = "";
    customTheme: boolean = false;
    appSubscription: Subscription;

    constructor(private route: ActivatedRoute, private appService: ApplicationService, private brandingService: BrandingService,
        @Inject(DOCUMENT) private document: Document, private renderer: Renderer2, private modalService: BsModalService, private appDataService: AppDataService) {
        const appId = route.paramMap.pipe(
            map(paramMap => paramMap.get('applicationId'))
        );

        this.app = appId.pipe(
            switchMap(appId => from(
                appService.detail(appId)
                    .then(res => res.data as any)
            )),
            tap((app: any & { applicationBuilder: any }) => {
                this.showIcon = !app.applicationBuilder.branding.hideIcon;
                if (app.applicationBuilder.branding.colors.hover === '' || app.applicationBuilder.branding.colors.hover === undefined) {
                    app.applicationBuilder.branding.colors.hover = '#14629F';
                }
            })
        )
        this.appSubscription = this.app.subscribe((app) => {
            this.themeName = app.applicationBuilder.selectedTheme;
            if (app.applicationBuilder.branding.enabled && (app.applicationBuilder.selectedTheme && app.applicationBuilder.selectedTheme !== 'Default')) {
                if (this.themeName === 'Navy Blue' || this.themeName === 'Red' || this.themeName === 'Green' || this.themeName === "Yellow" || this.themeName === 'Dark') {
                    this.applyTheme = true;
                    this.themeName = '';
                    this.renderer.addClass(this.document.body, 'body-theme');
                    this.customTheme = false;
                } else {
                    this.applyTheme = true;
                    this.renderer.addClass(this.document.body, 'body-theme');
                    this.customTheme = true;
                }
            } else {
                this.customTheme = false;
                this.applyTheme = false;
                this.themeName = '';
                app.applicationBuilder.branding.colors.hover = '#14629F';
            }
        });
    }

    async save(app) {
        this.dirty = false;
        await this.appService.update({
            id: app.id,
            applicationBuilder: app.applicationBuilder
        } as any);
        this.appDataService.forceUpdate = true;
        this.brandingService.updateStyleForApp(app);
    }

    showBrandingChange(app) {
        this.dirty = true;
        //     this.showIcon = !app.applicationBuilder.branding.hideIcon;
        this.brandingService.updateStyleForApp(app);
    }

    showBrandingLogoChange(app) {
        this.dirty = true;
        app.applicationBuilder.branding.hideIcon = !this.showIcon;
        this.brandingService.updateStyleForApp(app);
    }

    async ngOnDestroy(): Promise<void> {
        const appId = this.route.snapshot.paramMap.get('applicationId');
        const app = ((await this.appService.detail(appId)).data as any);
        this.brandingService.updateStyleForApp(app);
        this.renderer.removeClass(this.document.body, 'body-theme');
        this.appSubscription.unsubscribe();
    }

    async logoChange(app, files: FileList) {
        const file = files.item(0);
        if (file) {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.addEventListener("load", () => {
                    resolve(reader.result as string);
                }, false);
                reader.addEventListener("error", () => reject(new Error("Failed to read file")));
                reader.readAsDataURL(file);
            });

            const [logoWidth, logoHeight] = await new Promise<[number, number]>((resolve, reject) => {
                const img = new Image();
                img.addEventListener("load", () => {
                    resolve([img.width, img.height]);
                }, false);
                img.addEventListener("error", () => reject(new Error("Failed to read file")));
                img.src = dataUrl;
            });
            app.applicationBuilder.branding.logo = dataUrl;
            app.applicationBuilder.branding.logoHeight = Math.min(logoHeight, Math.ceil(240 * logoHeight / logoWidth));
        } else {
            this.removeLogo(app);
            return;
        }
        this.showBrandingChange(app);
    }

    removeLogo(app) {
        app.applicationBuilder.branding.logo = undefined;
        app.applicationBuilder.branding.hideIcon = false;
        app.applicationBuilder.branding.logoHeight = undefined;
        this.showBrandingChange(app);
    }

    setTheme(app, primary, active, text, textOnPrimary, textOnActive, hover, headerBar, tabBar, toolBar, selectedTheme) {
        app.applicationBuilder.branding.enabled = true;
        app.applicationBuilder.branding.colors.primary = primary;
        app.applicationBuilder.branding.colors.active = active;
        app.applicationBuilder.branding.colors.text = text;
        app.applicationBuilder.branding.colors.textOnPrimary = textOnPrimary;
        app.applicationBuilder.branding.colors.textOnActive = textOnActive;
        app.applicationBuilder.branding.colors.hover = hover;
        app.applicationBuilder.branding.colors.headerBar = headerBar;
        app.applicationBuilder.branding.colors.tabBar = tabBar;
        app.applicationBuilder.branding.colors.toolBar = toolBar;
        app.applicationBuilder.selectedTheme = selectedTheme;

        if (selectedTheme === 'Default') {
            this.customTheme = false;
            this.renderer.removeClass(this.document.body, 'body-theme');
            this.renderer.removeClass(this.document.body, 'dashboard-body-theme');
            this.applyTheme = false;
            this.themeName = '';
            // app.applicationBuilder.branding.enabled = false;
            this.showBrandingChange(app);
        } else {
            if (selectedTheme !== this.themeName) {
                this.themeName = '';
                this.customTheme = false;
                this.applyTheme = true;
                this.renderer.addClass(this.document.body, 'body-theme');
            } else if (selectedTheme === this.themeName) {
                this.customTheme = true;
                this.applyTheme = true;
                this.renderer.addClass(this.document.body, 'body-theme');
            }
            this.showBrandingChange(app);
        }
    }

    saveTheme(app, config) {
        let appBuilderObject = cloneDeep(app);
        this.bsModalRef = this.modalService.show(CustomBrandingComponent, {
            initialState: { app: appBuilderObject, config: config, theme: this.themeName }
        });
        this.bsModalRef.content.onSave.subscribe(async () => {
            this.themeName = this.bsModalRef.content.themeName;
            const appId = this.route.snapshot.paramMap.get('applicationId');
            this.app = from(this.appService.detail(appId).then(res => res.data as any));
            this.customTheme = true;
            this.applyTheme = true;
            this.renderer.addClass(this.document.body, 'body-theme');
        });
    }

    async deleteTheme(app) {
        let finalApp = app.applicationBuilder.customBranding.filter((theme) => theme.themeName !== this.themeName);
        app.applicationBuilder.customBranding = finalApp;
        app.applicationBuilder.selectedTheme = 'Default';
        this.setTheme(app, '#1776bf', '#14629F', '#0b385b', '#ffffff', '#ffffff', '#14629F', '#ffffff', '#ffffff', '#ffffff', 'Default');
        await this.appService.update({
            id: app.id,
            applicationBuilder: app.applicationBuilder
        } as any);
    }

    onThemeChange(value, app) {
        this.themeName = value;
        if (this.themeName !== '') {
            app.applicationBuilder.customBranding.forEach((theme) => {
                if (theme.themeName === value) {
                    this.customTheme = true;
                    this.setTheme(app, theme.colors.primary, theme.colors.active, theme.colors.text, theme.colors.textOnPrimary, theme.colors.textOnActive, theme.colors.hover, theme.colors.headerBar, theme.colors.tabBar, theme.colors.toolBar, this.themeName);
                    return;
                }
            })
        }
    }
}