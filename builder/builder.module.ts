import {NgModule} from "@angular/core";
import {ApplicationModule} from "./application/application.module";
import {RouterModule} from "@angular/router";
import {DashboardConfigComponent} from "./application-config/dashboard-config.component";
import {EditDashboardModalComponent} from "./application-config/edit-dashboard-modal.component";
import {NewDashboardModalComponent} from "./application-config/new-dashboard-modal.component";
import {CoreModule, HOOK_NAVIGATOR_NODES} from "@c8y/ngx-components";
import {IconSelectorModule} from "../icon-selector/icon-selector.module";
import {SortableModule, TooltipModule} from "ngx-bootstrap";
import {WizardModule} from "../wizard/wizard.module";
import {BrandingModule} from "./branding/branding.module";
import {AppBuilderNavigationService} from "./navigation/app-builder-navigation.service";
import {
    AppBuilderConfigNavigationRegistrationService,
    AppBuilderConfigNavigationService
} from "./navigation/app-builder-config-navigation.service";
import {BrandingComponent} from "./branding/branding.component";

@NgModule({
    imports: [
        ApplicationModule,
        RouterModule.forChild([
            {
                path: 'application/:applicationId/config',
                component: DashboardConfigComponent
            }, {
                path: 'application/:applicationId/branding',
                component: BrandingComponent
            }
        ]),
        CoreModule,
        IconSelectorModule,
        SortableModule.forRoot(),
        WizardModule,
        TooltipModule.forRoot(),
        BrandingModule.forRoot()
    ],
    declarations: [
        DashboardConfigComponent,
        NewDashboardModalComponent,
        EditDashboardModalComponent
    ],
    entryComponents: [
        NewDashboardModalComponent,
        EditDashboardModalComponent
    ],
    providers: [
        AppBuilderNavigationService,
        { provide: HOOK_NAVIGATOR_NODES, useExisting: AppBuilderNavigationService, multi: true},
        AppBuilderConfigNavigationRegistrationService,
        AppBuilderConfigNavigationService,
        { provide: HOOK_NAVIGATOR_NODES, useExisting: AppBuilderConfigNavigationService, multi: true},
    ]
})
export class BuilderModule {}
