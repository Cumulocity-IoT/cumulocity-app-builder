import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CoreModule } from '@c8y/ngx-components';
import { CustomPropertiesComponent } from './custom-properties.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        CoreModule,
    ],
    declarations: [
        CustomPropertiesComponent
    ],
    providers: [
    ]
})
export class SettingsModule {}