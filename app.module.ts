import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {NavigationError, Router, RouterModule as NgRouterModule} from '@angular/router';
import { UpgradeModule as NgUpgradeModule } from '@angular/upgrade/static';
import {AppStateService, CoreModule, RouterModule} from '@c8y/ngx-components';
import { DashboardUpgradeModule, UpgradeModule, HybridAppModule, UPGRADE_ROUTES } from '@c8y/ngx-components/upgrade';
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
    NgRouterModule.forRoot([
        ...UPGRADE_ROUTES
    ], { enableTracing: false, useHash: true }),
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
    constructor(protected upgrade: NgUpgradeModule, appStateService: AppStateService, router: Router, private runtimeWidgetLoaderService: RuntimeWidgetLoaderService) {
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
    }
}
