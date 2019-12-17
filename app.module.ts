import { NgModule} from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {RouterModule as NgRouterModule} from '@angular/router';
import {UpgradeModule as NgUpgradeModule} from '@angular/upgrade/static';
import {CoreModule, HOOK_NAVIGATOR_NODES, RouterModule} from '@c8y/ngx-components';
import { UpgradeModule, HybridAppModule, UPGRADE_ROUTES } from '@c8y/ngx-components/upgrade';
// import {DeviceSimulatorConfigModule} from "./device-simulator-config/device-simulator-config.module";
import {ApplicationBuilderModule} from "./application-builder/application-builder.module";
import {ApplicationModule} from "./application/application.module";
import {ConfigNavigationService, Navigation} from "./navigation";
// import {DeviceSimulatorConfigComponent} from "./device-simulator-config/device-simulator-config.component";
import {BrandingComponent} from "./branding/branding.component";
import {BrandingModule} from "./branding/branding.module";
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {BrandingDirtyGuardService} from "./branding/branding-dirty-guard.service";
// import {FixedValueSimulationStrategyModule} from "./simulation-strategies/fixed-value/fixed-value.simulation-strategy.module";
import {HelpComponent} from "./help/help.component";
import {MarkdownModule} from "ngx-markdown";
import {CustomWidgetsModule} from "./custom-widgets/custom-widgets.module";

@NgModule({
  declarations: [
    HelpComponent
  ],
  imports: [
    BrowserAnimationsModule,
    RouterModule.forRoot(),
    NgRouterModule.forRoot([
      // {
      //   path: 'application/:applicationId/simulator-config',
      //   component: DeviceSimulatorConfigComponent
      // },
      {
        path: 'application/:applicationId/branding',
        component: BrandingComponent,
        canDeactivate: [BrandingDirtyGuardService]
      }, {
        path: 'help',
        component: HelpComponent
      },
      ...UPGRADE_ROUTES,
    ], {enableTracing: false, useHash: true}),
    CoreModule.forRoot(),
    ApplicationBuilderModule,
    BsDropdownModule.forRoot(),
    CustomWidgetsModule,
    ApplicationModule,
    BrandingModule.forRoot(),
    // DeviceSimulatorConfigModule,
    // FixedValueSimulationStrategyModule,
    MarkdownModule.forRoot(),
    NgUpgradeModule,
    // Upgrade module must be the last
    UpgradeModule
  ],
  providers: [
    {provide: HOOK_NAVIGATOR_NODES, useClass: Navigation, multi: true},
    ConfigNavigationService
  ]
})
export class AppModule extends HybridAppModule {
  constructor(protected upgrade: NgUpgradeModule) {
    super();
  }
}
