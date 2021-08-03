import { EventEmitter, Output } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { ActionControl, BuiltInActionType, BulkActionControl, Column } from '@c8y/ngx-components';
import { AssetTypesListService } from './asset-types-list.service';
import { IManagedObject } from '@c8y/client';
import { json2csv } from 'json-2-csv';

@Component({
    selector: 'c8y-asset-types-list',
    templateUrl: './asset-types-list.component.html'
})

export class AssetTypesListComponent implements OnInit {
    @Input() refresh: EventEmitter<any> = new EventEmitter();

    @Output() onEditEntry: EventEmitter<IManagedObject> = new EventEmitter();

    columns: Column[] = [
        {
            name: 'name',
            header: 'Name',
            path: 'name',
            filterable: true,
        }
    ];

    actionControls: ActionControl[] = [
        { type: BuiltInActionType.Edit, callback: (item: IManagedObject) => this.onEditAssetTypeSelected(item) },
        { type: BuiltInActionType.Delete, callback: (item: IManagedObject) => this.onDeleteAssetTypeSelected(item) },
        { type: BuiltInActionType.Export, callback: (item: IManagedObject) => this.onExportSelected(item) }
    ];

    bulkActionControls: BulkActionControl[] = [
        { type: BuiltInActionType.Delete, callback: selectedItemIds => this.onDeleteAssetTypesSelected(selectedItemIds) }
    ];


    constructor(public assetTypesListService: AssetTypesListService) {
    }

    ngOnInit() {
    }

    handleItemsSelect(selectedItemIds) {
        console.log('selected item ids:');
        console.dir(selectedItemIds);
    }

    private async onDeleteAssetTypeSelected(assetType: IManagedObject): Promise<void> {
        await this.assetTypesListService.deleteAssetType(assetType.id);
        this.refresh.emit();
    }

    private async onDeleteAssetTypesSelected(assetTypeIds: string[]): Promise<void> {
        await this.assetTypesListService.deleteAssetTypes(assetTypeIds);
        this.refresh.emit();
    }

    private onEditAssetTypeSelected(assetType: IManagedObject): void {
        this.onEditEntry.emit(assetType);
    }

    private async onExportSelected(assetType: IManagedObject): Promise<void> {
        const properties = await this.assetTypesListService.getProperties(assetType['c8y_IsAssetType']['propertyIds']);

        let csvStructureValues = {
            name: "",
            description: "",
            type: assetType.name,
        };

        properties.forEach(property => csvStructureValues = { ...csvStructureValues, ...property['c8y_PropertyDescription']['model'] });

        json2csv([csvStructureValues], (error, csvString) => {
            this.assetTypesListService.downloadFile(csvString, `${assetType.name}.csv`, 'text/csv');
        })
    }
}