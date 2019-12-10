import {Component, EventEmitter, Input, Output} from "@angular/core";

@Component({
    selector: 'wizard-step',
    template: `<ng-container *ngIf="!hidden"><ng-content></ng-content></ng-container>`
})
export class WizardStepComponent {
    @Input() stepId: string;

    public hidden: boolean;
}