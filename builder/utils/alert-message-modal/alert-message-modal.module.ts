import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { CoreModule } from "@c8y/ngx-components";
import { AlertMessageModalComponent } from './alert-message-modal.component';


@NgModule({
    imports: [
        CommonModule,
        CoreModule,
    ],
    declarations: [
        AlertMessageModalComponent
    ],
    entryComponents: [
        AlertMessageModalComponent
    ],
    providers: []
})
export class AlertMessageModalModule {

}