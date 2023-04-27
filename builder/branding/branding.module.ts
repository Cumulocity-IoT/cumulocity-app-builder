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

import {ModuleWithProviders, NgModule} from "@angular/core";

import {BrandingComponent} from "./branding.component";
import {CommonModule} from "@angular/common";
import {BrandingService} from "./branding.service";
import {switchMap} from "rxjs/operators";
import {from, of} from "rxjs";
import {ApplicationService} from "@c8y/client";
import {CoreModule} from "@c8y/ngx-components";
import {BrandingDirtyGuardService} from "./branding-dirty-guard.service";
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import {AppIdService} from "../app-id.service";
import { AppDataService } from "./../../builder/app-data.service";
import { CustomBrandingComponent } from "./custom-branding.component";
@NgModule({
    imports: [
        CommonModule,
        CoreModule,
        ButtonsModule.forRoot()
    ],
    declarations: [
        BrandingComponent,
        CustomBrandingComponent
    ],entryComponents: [
        CustomBrandingComponent
    ],
})
export class BrandingModule {
    constructor(appIdService: AppIdService, appService: ApplicationService, 
        appDataService: AppDataService, brandingService: BrandingService) {
        appIdService.appIdDelayedUntilAfterLogin$.pipe(switchMap(appId => {
            if (appId != undefined) {
                return from(appDataService.getAppDetails(appId));
            } else {
                return of(undefined);
            }
        }))
            .subscribe(async app => {
                brandingService.updateStyleForApp(app);
            });
    }

    static forRoot(): ModuleWithProviders<BrandingModule> {
        return {
            ngModule: BrandingModule,
            providers: [
                BrandingService,
                BrandingDirtyGuardService
            ]
        }
    }
}