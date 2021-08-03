import { CommonModule as NgCommonModule } from '@angular/common';
import { FormsModule as NgFormModule } from "@angular/forms";
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CoreModule, DynamicFormsModule, FormsModule, HOOK_NAVIGATOR_NODES, HOOK_ONCE_ROUTE } from '@c8y/ngx-components';
import { AssetTypesComponent } from './asset-types.component';
import { AssetTypesFactory } from './asset-types.factory';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AssetTypesListComponent } from './asset-types-list/asset-types-list.component';
import { ManageAssetTypeComponent } from './manage-asset-type/manage-asset-type.component';

@NgModule({
    imports: [NgCommonModule, NgFormModule, CoreModule, ReactiveFormsModule, DynamicFormsModule, TooltipModule, NgSelectModule],
    exports: [],
    declarations: [AssetTypesComponent, AssetTypesListComponent, ManageAssetTypeComponent],
    entryComponents: [AssetTypesComponent, AssetTypesListComponent, ManageAssetTypeComponent],
})
export class AssetTypesModule { }
