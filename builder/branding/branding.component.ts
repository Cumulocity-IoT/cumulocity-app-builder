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

import {Component, OnDestroy} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {ApplicationService} from "@c8y/client";
import {map, switchMap, tap} from "rxjs/operators";
import {from, Observable} from "rxjs";
import {BrandingService} from "./branding.service";

@Component({
    templateUrl: './branding.component.html'
})
export class BrandingComponent implements OnDestroy{
    app: Observable<any>;
    dirty = false;
    showIcon = true;
    constructor(private route: ActivatedRoute, private appService: ApplicationService, private brandingService: BrandingService) {
        const appId = route.paramMap.pipe(
            map(paramMap => paramMap.get('applicationId'))
        );

        this.app = appId.pipe(
            switchMap(appId => from(
                appService.detail(appId)
                    .then(res => res.data as any)
            )),
            tap((app: any & {applicationBuilder: any}) => { 
                this.showIcon = !app.applicationBuilder.branding.hideIcon;
            })
        )
    }

    async save(app) {
        this.dirty = false;
        await this.appService.update({
            id: app.id,
            applicationBuilder: app.applicationBuilder
        } as any);

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
            app.applicationBuilder.branding.logoHeight = Math.min(logoHeight, Math.ceil(240*logoHeight/logoWidth));
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

    setTheme(app, primary, active, text, textOnPrimary, textOnActive, headerBar, tabBar, toolBar) {
        app.applicationBuilder.branding.enabled = true;
        app.applicationBuilder.branding.colors.primary = primary;
        app.applicationBuilder.branding.colors.active = active;
        app.applicationBuilder.branding.colors.text = text;
        app.applicationBuilder.branding.colors.textOnPrimary = textOnPrimary;
        app.applicationBuilder.branding.colors.textOnActive = textOnActive;
        app.applicationBuilder.branding.colors.headerBar = headerBar;
        app.applicationBuilder.branding.colors.tabBar = tabBar;
        app.applicationBuilder.branding.colors.toolBar = toolBar;
        this.showBrandingChange(app);
    }
}