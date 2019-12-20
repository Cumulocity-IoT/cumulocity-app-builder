import {CoreModule, HOOK_NAVIGATOR_NODES} from "@c8y/ngx-components";
import {Injectable, NgModule} from "@angular/core";

import {
    ActivatedRouteSnapshot,
    CanActivate,
    Router,
    RouterModule,
    RouterStateSnapshot,
    UrlTree
} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {ApplicationService} from "@c8y/client";
import {DashboardNavigation} from "./dashboard.navigation";
import {DashboardModule} from "./dashboard/dashboard.module";
import {DashboardConfigComponent} from "./dashboard-config/dashboard-config.component";
import {CommonModule} from "@angular/common";
import { SortableModule } from 'ngx-bootstrap/sortable';
import {NewDashboardModalComponent} from "./dashboard-config/new-dashboard-modal.component";
import {WizardModule} from "../wizard/wizard.module";
import {DataExplorerModule} from "./dataexplorer/data-explorer.module";
import {SmartRulesModule} from "./smartrules/smart-rules.module";
import {AlarmsModule} from "./alarms/alarms.module";
import {IconSelectorModule} from "../icon-selector/icon-selector.module";
import {EditDashboardModalComponent} from "./dashboard-config/edit-dashboard-modal.component";
import {TooltipModule} from "ngx-bootstrap";

@Injectable()
class RedirectToFirstDashboard implements CanActivate {
    constructor(private appService: ApplicationService, private router: Router) {}

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
        const appId = route.paramMap.get('applicationId');
        const application = (await this.appService.detail(appId)).data as any;
        if (application && application.applicationBuilder) {
            if (application.applicationBuilder.dashboards && application.applicationBuilder.dashboards.length > 0) {
                console.debug('Redirecting to first dashboard');
                // Seems to be a bug handling ng1 hashchanges so we manually navigate too
                this.router.navigate([`/application/${appId}/dashboard/${application.applicationBuilder.dashboards[0].id}`]);
                return this.router.parseUrl(`/application/${appId}/dashboard/${application.applicationBuilder.dashboards[0].id}`);
            } else {
                console.debug('No dashboards available redirecting to config');
                // Seems to be a bug handling ng1 hashchanges so we manually navigate too
                this.router.navigate([`/application/${appId}/config`]);
                return this.router.parseUrl(`/application/${appId}/config`);
            }
        } else {
            console.error(`Application ${appId} isn't an application-builder application`);
            // Seems to be a bug handling ng1 hashchanges so we manually navigate too
            this.router.navigate(['']);
            return this.router.parseUrl('');
        }
    }
}

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild([
            {
                path: 'application/:applicationId/config',
                component: DashboardConfigComponent
            }, {
                path: 'application/:applicationId',
                canActivate: [RedirectToFirstDashboard],
                children: []
            }
        ]),
        DashboardModule,
        DataExplorerModule,
        SmartRulesModule,
        AlarmsModule,
        CoreModule,
        SortableModule.forRoot(),
        WizardModule,
        IconSelectorModule,
        TooltipModule.forRoot()
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
        DashboardNavigation,
        { provide: HOOK_NAVIGATOR_NODES, useExisting: DashboardNavigation, multi: true},
        //{ provide: HOOK_NAVIGATOR_NODES, useClass: DashboardConfigNavigation, multi: true},
        RedirectToFirstDashboard,
    ]
})
export class ApplicationModule {}