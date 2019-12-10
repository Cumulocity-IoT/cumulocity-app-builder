import {Component} from "@angular/core";

// noinspection AngularMissingOrInvalidDeclarationInModule
@Component({
    template: `        
        <div class="form-group">
            <label for="value"><span>Value</span></label>
            <input type="number" class="form-control" id="value" name="value" placeholder="e.g. 15 (required)" required autofocus [(ngModel)]="config.value">
        </div>
    `
})
export class FixedValueSimulationStrategyConfigComponent {
    config: any;
}