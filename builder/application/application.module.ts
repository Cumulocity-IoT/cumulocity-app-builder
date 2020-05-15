import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {AppBuilderContextDashboardComponent} from "./app-builder-context-dashboard.component";
import {DashboardByIdModule} from "../../dashboard-by-id/dashboard-by-id.module";
import {CoreModule} from "@c8y/ngx-components";
import {AppBuilderSmartRulesComponent} from "./app-builder-smart-rules.component";

@NgModule({
    imports: [
        RouterModule.forChild([
            ...[
                'application/:applicationId/tabgroup/:tabGroup/dashboard/:dashboardId/device/:deviceId',
                'application/:applicationId/tabgroup/:tabGroup/device/:deviceId/:deviceDetail',
                'application/:applicationId/tabgroup/:tabGroup/dashboard/:dashboardId',
                'application/:applicationId/dashboard/:dashboardId/device/:deviceId',
                'application/:applicationId/dashboard/:dashboardId/device/:deviceId/:deviceDetail',
                'application/:applicationId/dashboard/:dashboardId'
            ].map(path => ({
                path,
                component: AppBuilderContextDashboardComponent
            }))
        ]),
        DashboardByIdModule,
        CoreModule
    ],
    declarations: [
        AppBuilderContextDashboardComponent,
        AppBuilderSmartRulesComponent
    ]
})
export class ApplicationModule {}
