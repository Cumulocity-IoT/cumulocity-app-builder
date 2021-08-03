import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'c8y-field-dynamic-input',
  template: `
    <ng-container *ngFor="let f of field.fieldGroup">
      <ng-container [ngSwitch]="f.type">
        <formly-field *ngSwitchCase="'input'" [field]="f"></formly-field>
        <formly-field *ngSwitchCase="'number-ext'" [field]="f"></formly-field>
      </ng-container>
    </ng-container>
  `,
})
export class FieldDynamicInput extends FieldType {
}