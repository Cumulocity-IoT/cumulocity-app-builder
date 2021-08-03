import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoreModule, DynamicFormsModule } from '@c8y/ngx-components';
import { DeviceGridModule } from '@c8y/ngx-components/device-grid';
import { AddAssetComponent } from './add-asset.component';
import { AddAssetService } from './add-asset.service';

@NgModule({
    imports: [CoreModule, DeviceGridModule, FormsModule, ReactiveFormsModule, DynamicFormsModule],
    exports: [AddAssetComponent],
    declarations: [AddAssetComponent],
    entryComponents: [AddAssetComponent],
    providers: [AddAssetService],
})
export class AddAssetModule { }
