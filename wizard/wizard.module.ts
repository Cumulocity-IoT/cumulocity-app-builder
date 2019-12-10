import {NgModule} from "@angular/core";
import {WizardComponent} from "./wizard.component";
import {WizardStepComponent} from "./wizard-step.component";
import {CommonModule} from "@angular/common";

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        WizardComponent,
        WizardStepComponent
    ],
    exports: [
        WizardComponent,
        WizardStepComponent
    ]
})
export class WizardModule {}