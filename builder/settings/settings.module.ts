import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CoreModule } from '@c8y/ngx-components';
import { CustomPropertiesComponent } from './custom-properties.component';
import { RectangleSpinnerModule } from "../utils/rectangle-spinner/rectangle-spinner.module";
import { ButtonsModule } from 'ngx-bootstrap/buttons';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        CoreModule,
        RectangleSpinnerModule,
        ButtonsModule.forRoot()
    ],
    declarations: [
        CustomPropertiesComponent
    ],
    providers: [
    ]
})
export class SettingsModule {}