import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CoreModule, HOOK_NAVIGATOR_NODES, HOOK_ONCE_ROUTE, HOOK_TABS } from '@c8y/ngx-components';
import { AssetTypesComponent } from '../asset-types/asset-types.component';
import { PropertiesLibraryComponent } from '../properties-library/properties-library.component';
import { AssetTypesModule } from '../asset-types/asset-types.module';
import { PropertiesLibraryModule } from '../properties-library/properties-library.module';
import { AddAssetModule } from './add-asset/add-asset.module';
import { AssetsOverviewComponent } from './assets-overview.component';
import { AssetOverviewFactory } from './assets-overview.factory';
import { AssetTabFactory } from './assets-overview.tabfactory';


const routes: Routes = [
    {
        path: 'assets',
        redirectTo: 'assets/overview'
    },
    {
        path: 'assets/overview',
        component: AssetsOverviewComponent
    },
    {
        path: 'assets/types',
        component: AssetTypesComponent
    },
    {
        path: 'assets/property-library',
        component: PropertiesLibraryComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
        CoreModule,
        AddAssetModule,
        PropertiesLibraryModule,
        AssetTypesModule
    ],
    exports: [],
    declarations: [AssetsOverviewComponent],
    entryComponents: [AssetsOverviewComponent],
    providers: [
        {
            provide: HOOK_TABS, useClass: AssetTabFactory, multi: true
        },
    ],
})
export class AssetsOverviewModule { }
