import {NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {ApplicationBuilderComponent} from "./application-builder.component";
import {CommonModule} from "@angular/common";
import {CoreModule, HOOK_NAVIGATOR_NODES} from "@c8y/ngx-components";
import {ApplicationBuilderNavigation} from "./application-builder.navigation";
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {NewApplicationModalComponent} from "./new-application-modal.component";

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
                redirectTo: 'application-builder'
            }
        ]),
        CoreModule
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
    ]
})
export class ApplicationBuilderModule {}