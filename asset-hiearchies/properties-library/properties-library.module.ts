import { CommonModule as NgCommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CoreModule, DynamicFormsModule, FormsModule, HOOK_NAVIGATOR_NODES, HOOK_ONCE_ROUTE } from '@c8y/ngx-components';
import { PropertiesLibraryManagePropertyComponent } from './manage-property/manage-property.component';
import { PropertiesLibraryComponent } from './properties-library.component';
import { PropertiesLibraryFactory } from './properties-library.factory';
import { PropertiesLibraryListComponent } from './properties-list/properties-list.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { FORMLY_CONFIG } from '@ngx-formly/core';
import { FieldSelect } from './formly-custom-elements/select.type.component';
import { FieldDynamicInput } from './formly-custom-elements/dynamic-input.type.component';
import { FieldNumber } from './formly-custom-elements/number.type.component';


@NgModule({
    imports: [NgCommonModule, CoreModule, FormsModule, ReactiveFormsModule, DynamicFormsModule, TooltipModule],
    exports: [],
    declarations: [
        PropertiesLibraryComponent,
        PropertiesLibraryListComponent,
        PropertiesLibraryManagePropertyComponent,
        FieldSelect,
        FieldNumber,
        FieldDynamicInput
    ],
    entryComponents: [
        PropertiesLibraryComponent,
        PropertiesLibraryListComponent,
        PropertiesLibraryManagePropertyComponent,
        FieldSelect,
        FieldNumber,
        FieldDynamicInput
    ],
    providers: [
        {
            provide: FORMLY_CONFIG,
            multi: true,
            useValue: {
                types: [
                    {
                        name: 'select',
                        component: FieldSelect,
                        wrappers: ['c8y-form-field']
                    },
                    {
                        name: 'number-ext',
                        component: FieldNumber,
                        wrappers: ['c8y-form-field']
                    },
                    {
                        name: 'dynamic-input',
                        component: FieldDynamicInput,
                        wrappers: ['c8y-form-field']
                    }
                ]
            }
        }],
})
export class PropertiesLibraryModule { }
