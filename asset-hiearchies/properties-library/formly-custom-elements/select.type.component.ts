import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ConfigOption, FieldType } from '@ngx-formly/core';

@Component({
    selector: 'c8y-field-select',
    templateUrl: './select.type.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldSelect extends FieldType {
    static readonly CONFIG: ConfigOption = {
        types: [
            {
                name: 'select',
                component: FieldSelect,
                wrappers: ['c8y-form-field']
            }
        ]
    };
}