import {DashboardByIdComponent} from "./dashboard-by-id.component";
import {NgModule} from "@angular/core";
import {CoreModule, DashboardModule} from "@c8y/ngx-components";
import {ContextDashboardModule} from "@c8y/ngx-components/context-dashboard";

@NgModule({
    imports: [
        DashboardModule,
        CoreModule,
        ContextDashboardModule.config({})
    ],
    declarations: [
        DashboardByIdComponent
    ],
    exports: [
        DashboardByIdComponent
    ]
})
export class DashboardByIdModule {}
