import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { CoreModule } from "@c8y/ngx-components";
import { RectangleSpinnerModule } from "../rectangle-spinner/rectangle-spinner.module";
import { ProgressIndicatorModalComponent } from "./progress-indicator-modal.component";
import { ProgressIndicatorService } from './progress-indicator.service';

@NgModule({
    imports: [
        CommonModule,
        CoreModule,
        RectangleSpinnerModule
    ],
    declarations: [
        ProgressIndicatorModalComponent
    ],
    entryComponents: [
        ProgressIndicatorModalComponent
    ],
})
export class ProgressIndicatorModalModule {

}