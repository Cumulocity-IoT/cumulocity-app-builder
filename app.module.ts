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
import {Injector, NgModule} from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {NavigationError, Router, RouterModule as NgRouterModule} from '@angular/router';
import { UpgradeModule as NgUpgradeModule } from '@angular/upgrade/static';
import {AppStateService, CoreModule, RouterModule} from '@c8y/ngx-components';
import {DashboardUpgradeModule, UpgradeModule, HybridAppModule} from '@c8y/ngx-components/upgrade';
import {BuilderModule} from "./builder/builder.module";
import {filter, first, map, startWith, tap, withLatestFrom} from "rxjs/operators";
import { IUser } from '@c8y/client';
import {SimulationStrategiesModule} from "./simulation-strategies/simulation-strategies.module";
import {CustomWidgetsModule} from "./custom-widgets/custom-widgets.module";
import {RuntimeWidgetInstallerModule, RuntimeWidgetLoaderService} from "cumulocity-runtime-widget-loader";

@NgModule({
  imports: [
    // Upgrade module must be the first
    UpgradeModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(),
    NgRouterModule.forRoot([], { enableTracing: false, useHash: true }),
    CoreModule.forRoot(),
    NgUpgradeModule,
    DashboardUpgradeModule,
    BuilderModule,
    SimulationStrategiesModule,
    CustomWidgetsModule,
    RuntimeWidgetInstallerModule
  ]
})
export class AppModule extends HybridAppModule {
    constructor(protected upgrade: NgUpgradeModule, appStateService: AppStateService, private router: Router, private runtimeWidgetLoaderService: RuntimeWidgetLoaderService, private injector: Injector) {
        super();

        // Fixes a bug where the router removes the hash when the user tries to navigate to an app and is not logged in
        appStateService.currentUser.pipe(filter(user => user != null)).pipe(
            withLatestFrom(
                router.events.pipe(
                    filter(event => event instanceof NavigationError),
                    tap((event: NavigationError) => {
                        if ((location as any).replaceState) {
                            // Change the location without navigating anywhere
                            (location as any).replaceState(event.url)
                        }
                    }),
                    startWith(null)
                )
            ),
            first(),
            filter(([, event]: [IUser, NavigationError | null]) => event != null),
            map(([, event]: [IUser, NavigationError]) => event)
        ).subscribe(event => router.navigateByUrl(event.url));
    }

    ngDoBootstrap(): void {
        super.ngDoBootstrap();
        // Only do this after bootstrapping so that angularJs is loaded
        this.runtimeWidgetLoaderService.loadRuntimeWidgets();

        // A hack to get href hash changes to always trigger an Angular Router update... There seems to be an AngularUpgrade/AngularJS/Cumulocity bug somewhere that stops the hashchange event firing.
        // This bug is apparent when trying to use the AppSwitcher to change to another AppBuilder App, sometimes it works, sometimes it doesn't
        const $injector = this.injector.get('$injector');
        $injector.invoke(['$rootScope', ($rootScope) => {
            $rootScope.$on('$locationChangeStart', (event, next, current) => {
                const nextSplit = next.split('#');
                const currentSplit = current.split('#');
                if (nextSplit[0] != currentSplit[0]) {
                    return;
                }
                this.router.navigateByUrl(nextSplit.length > 1 ? nextSplit[1] : '');
            });
        }]);
    }
}
