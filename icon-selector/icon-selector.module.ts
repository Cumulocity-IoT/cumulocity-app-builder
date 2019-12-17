import {NgModule} from "@angular/core";
import {NgSelectModule} from "@ng-select/ng-select";
import {IconSelectorComponent} from "./icon-selector.component";
import {FormsModule} from "@angular/forms";
import {CoreModule} from "@c8y/ngx-components";

@NgModule({
    imports: [
        NgSelectModule,
        FormsModule,
        CoreModule
    ],
    declarations: [
        IconSelectorComponent
    ],
    exports: [
        IconSelectorComponent
    ]
})
export class IconSelectorModule {}