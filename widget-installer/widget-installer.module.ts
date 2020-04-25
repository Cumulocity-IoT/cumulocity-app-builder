import {CoreModule} from "@c8y/ngx-components";
import {NgModule} from "@angular/core";
import {InstallWidgetModalComponent} from "./install-widget-modal.component";
@NgModule({
    imports: [
        CoreModule
    ],
    declarations: [InstallWidgetModalComponent],
    entryComponents: [InstallWidgetModalComponent]
})
export class WidgetInstallerModule {}
