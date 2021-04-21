import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { CoreModule } from "@c8y/ngx-components";
import { RectangleSpinnerComponent } from "./rectangle-spinner.component";

@NgModule({
    imports: [
        CommonModule,
        CoreModule
    ],
    declarations: [
        RectangleSpinnerComponent
    ],
    exports: [
        RectangleSpinnerComponent
    ]
})
export class RectangleSpinnerModule { }