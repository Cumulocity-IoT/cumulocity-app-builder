import { Component, EventEmitter, OnInit } from '@angular/core';
import { IManagedObject } from "@c8y/client";

@Component({
    selector: 'c8y-asset-types',
    templateUrl: './asset-types.component.html'
})

export class AssetTypesComponent implements OnInit {
    refresh: EventEmitter<any> = new EventEmitter();

    public showAddAssetType = false;

    public assetTypeToUpdate: IManagedObject;

    constructor() { }

    ngOnInit() { }

    onEditAssetType(assetType: IManagedObject) {
        this.assetTypeToUpdate = assetType;
        this.showAddAssetType = true;
    }

    onCloseDialog() {
        this.assetTypeToUpdate = null;
        this.showAddAssetType = false;
    }
}