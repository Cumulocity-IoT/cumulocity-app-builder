import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { CoreModule } from "@c8y/ngx-components";
import { DeviceSelectorModalComponent } from "./device-selector.component";
import { DeviceSelectorModalService } from "./device-selector.service";

@NgModule({
    imports: [
        CommonModule,
        CoreModule
    ],
    declarations: [
        DeviceSelectorModalComponent
    ],
    entryComponents: [
        DeviceSelectorModalComponent
    ],
    providers: [
        DeviceSelectorModalService
    ]
})
export class DeviceSelectorModalModule {

}