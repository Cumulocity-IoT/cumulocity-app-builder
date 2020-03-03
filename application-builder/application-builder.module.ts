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

import {Injectable, NgModule} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivate, Router, RouterModule, RouterStateSnapshot, UrlTree} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {ApplicationBuilderComponent} from "./application-builder.component";
import {CommonModule} from "@angular/common";
import {AppStateService, CoreModule, HOOK_NAVIGATOR_NODES} from "@c8y/ngx-components";
import {ApplicationBuilderNavigation} from "./application-builder.navigation";
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {NewApplicationModalComponent} from "./new-application-modal.component";
import {IconSelectorModule} from "../icon-selector/icon-selector.module";
import {ApplicationService, IApplication} from "@c8y/client";
import { filter, first } from "rxjs/operators";
import {contextPathFromURL} from "../utils/contextPathFromURL";

@Injectable()
class RedirectToDefaultApplicationOrBuilder implements CanActivate {
    constructor(private appService: ApplicationService, private router: Router, private appStateService: AppStateService) {}

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
        await this.appStateService.currentUser
            .pipe(
                filter(user => user != undefined),
                first()
            ).toPromise();

        const appList = (await this.appService.list({pageSize: 2000})).data;
        const app = appList.find(app => app.contextPath === contextPathFromURL());

        if (app && (app as IApplication & {applicationBuilder?:any}).applicationBuilder) {
            console.debug('Found a default application, loading it...');
            return this.router.parseUrl(`/application/${app.id}`);
        } else {
            console.debug('No default application, loading the the application builder...');
            return this.router.parseUrl('application-builder');
        }
    }
}

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        BsDropdownModule.forRoot(),
        RouterModule.forChild([
            {
                path: 'application-builder',
                component: ApplicationBuilderComponent
            },
            {
                path: '',
                pathMatch: 'full',
                canActivate: [RedirectToDefaultApplicationOrBuilder],
                children: []
            }
        ]),
        CoreModule,
        IconSelectorModule
    ],
    declarations: [
        ApplicationBuilderComponent,
        NewApplicationModalComponent
    ],
    entryComponents: [
        NewApplicationModalComponent
    ],
    providers: [
        { provide: HOOK_NAVIGATOR_NODES, useClass: ApplicationBuilderNavigation, multi: true},
        RedirectToDefaultApplicationOrBuilder,
    ]
})
export class ApplicationBuilderModule {}
