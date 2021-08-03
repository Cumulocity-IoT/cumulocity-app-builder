import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ConfigOption, FieldType } from '@ngx-formly/core';

@Component({
    selector: 'c8y-field-number',
    templateUrl: './number.type.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldNumber extends FieldType {
}