import {Injectable, NgModule} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterModule, RouterStateSnapshot} from "@angular/router";
import {AppBuilderContextDashboardComponent} from "./app-builder-context-dashboard.component";
import {DashboardByIdModule} from "../../dashboard-by-id/dashboard-by-id.module";
import {CoreModule} from "@c8y/ngx-components";
import {AppBuilderSmartRulesComponent} from "./app-builder-smart-rules.component";
import {LegacyDataExplorerComponent} from "./dataexplorer/legacy-data-explorer.component";
import {LegacySmartRulesComponent} from "./smartrules/legacy-smart-rules.component";

@Injectable({
    providedIn: 'root',
})
export class DeviceContextResolverService implements Resolve<string> {
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): string {
        let deviceId = route.paramMap.get('deviceId');
        if (deviceId) {
            return "device";
        } else {
            return undefined;
        }
    }
}

@Injectable({
    providedIn: 'root',
})
export class DeviceContextDataResolverService implements Resolve<{context: string, id: string}> {
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): {context: string, id: string} {
        let deviceId = route.paramMap.get('deviceId');
        if (deviceId) {
            return {
                context: "device",
                id: deviceId
            }
        } else {
            return undefined;
        }
    }
}

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
                resolve: {
                    context: DeviceContextResolverService,
                    contextData: DeviceContextDataResolverService
                },
                component: AppBuilderContextDashboardComponent
            }))
        ]),
        DashboardByIdModule,
        CoreModule
    ],
    declarations: [
        AppBuilderContextDashboardComponent,
        AppBuilderSmartRulesComponent,
        LegacyDataExplorerComponent,
        LegacySmartRulesComponent
    ]
})
export class ApplicationModule {}
