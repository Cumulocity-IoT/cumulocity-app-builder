import { NgModule } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule, CoreModule } from '@c8y/ngx-components';
import { TemplateCatalogModalComponent } from "./template-catalog.component";
import { TemplateCatalogService } from "./template-catalog.service";
import { IconSelectorModule } from "../../icon-selector/icon-selector.module";
import { RectangleSpinnerModule } from "../utils/rectangle-spinner/rectangle-spinner.module";
import { DeviceSelectorModalModule } from "../utils/device-selector/device-selector.module";
import { TemplateUpdateModalComponent } from "./template-update.component";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        CoreModule,
        IconSelectorModule,
        RectangleSpinnerModule,
        DeviceSelectorModalModule
    ],
    declarations: [
        TemplateCatalogModalComponent,
        TemplateUpdateModalComponent
    ],
    entryComponents: [
        TemplateCatalogModalComponent,
        TemplateUpdateModalComponent
    ],
    providers: [
        TemplateCatalogService
    ]
})
export class TemplateCatalogModule { }