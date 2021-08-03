import { Component, EventEmitter, OnInit } from '@angular/core';
import { getFakeData } from './fake-data';
import {
    ActionControl,
    BuiltInActionType,
    BulkActionControl,
    Column,
    Pagination
} from '@c8y/ngx-components';
import { IManagedObject } from '@c8y/client';
import { AssetOverviewDatasourceService } from './assets-overview.service';

@Component({
    selector: 'c8y-assets-overview',
    templateUrl: './assets-overview.component.html'
})

export class AssetsOverviewComponent implements OnInit {
    columns: Column[] = [
        {
            name: 'id',
            header: 'ID',
            path: 'id',
            filterable: true,
        },
        {
            name: 'name',
            header: 'Name',
            path: 'name',
            filterable: true,
        },
        {
            name: 'type',
            header: 'Type',
            path: 'type',
            filterable: true,
        },
        { name: 'creationTime', header: 'Creation time', path: 'creationTime' },
        { name: 'lastUpdated', header: 'Last updated', path: 'lastUpdated' }
    ];

    actionControls: ActionControl[] = [
        { type: BuiltInActionType.Edit, callback: (item: IManagedObject) => this.updateAsset(item) },
        { type: BuiltInActionType.Delete, callback: (item: IManagedObject) => this.onDeleteAsset(item) }
    ];

    bulkActionControls: BulkActionControl[] = [
        { type: BuiltInActionType.Delete, callback: selectedItemIds => this.onDeleteAssets(selectedItemIds) }
    ];

    fakeData: any[];

    refresh: EventEmitter<any> = new EventEmitter();

    showAddAsset = false;

    showUpdateAsset = false;

    selectedAsset: IManagedObject;

    constructor(public datasource: AssetOverviewDatasourceService) { }

    ngOnInit() {
        this.fakeData = getFakeData();
    }

    handleItemsSelect(selectedItemIds) {
        console.log('selected item ids:');
        console.dir(selectedItemIds);
    }

    handleClick() {
        this.fakeData[0].id = Math.random();
    }

    updateAsset(asset: IManagedObject) {
        this.selectedAsset = asset;
        this.showUpdateAsset = true;
    }

    async onDeleteAssets(assetIds: string[]) {
        this.datasource.deleteAssets(assetIds).then(() => {
            this.refresh.emit();
        });
    }

    async onDeleteAsset(asset: IManagedObject) {
        this.datasource.deleteAsset(asset.id).then(() => {
            this.refresh.emit();
        });
    }
}