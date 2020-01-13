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
import {distinctUntilChanged, filter, map, mapTo, switchMap, first} from "rxjs/operators";
import {ActivationEnd, Router} from "@angular/router";
import {from, of} from "rxjs";
import {ApplicationService} from "@c8y/client";
import {AppStateService, CoreModule} from "@c8y/ngx-components";
import {BrandingDirtyGuardService} from "./branding-dirty-guard.service";
import { ButtonsModule } from 'ngx-bootstrap/buttons';

@NgModule({
    imports: [
        CommonModule,
        CoreModule,
        ButtonsModule.forRoot()
    ],
    declarations: [
        BrandingComponent
    ]
})
export class BrandingModule {
    constructor(router: Router, appService: ApplicationService, brandingService: BrandingService, appStateService: AppStateService) {
        router.events
            .pipe(
                filter(event => event instanceof ActivationEnd),
                map((event: ActivationEnd) => event.snapshot.url),
                // Delay until after login
                switchMap(url => appStateService.currentUser.pipe(
                    filter(user => user != null),
                    first(),
                    mapTo(url)
                )),
                switchMap(url => {
                    if (url.length >= 2 && url[0].path === 'application') {
                        const appId = url[1].path;
                        return from(appService.detail(appId))
                            .pipe(
                                map(res => res.data as any)
                            );
                    } else {
                        return of(undefined);
                    }
                }),
                distinctUntilChanged((prev, curr) => {
                    if (prev == undefined || curr == undefined) {
                        return prev == undefined && curr == undefined;
                    } else {
                        return prev.id == curr.id;
                    }
                })
            )
            .subscribe(app => {
                brandingService.updateStyleForApp(app);
            });
    }

    static forRoot(): ModuleWithProviders {
        return {
            ngModule: BrandingModule,
            providers: [
                BrandingService,
                BrandingDirtyGuardService
            ]
        }
    }
}