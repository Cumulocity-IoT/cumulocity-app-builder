import { Component, EventEmitter, OnInit } from '@angular/core';
import { IManagedObject } from '@c8y/client';

@Component({
    selector: 'c8y-properties-library',
    templateUrl: './properties-library.component.html'
})
export class PropertiesLibraryComponent implements OnInit {
    refresh: EventEmitter<any> = new EventEmitter();

    public showAddProperty: boolean = false;

    public propertyToUpdate: IManagedObject;

    constructor() { }

    ngOnInit() { }

    public onEditProperty(property: IManagedObject): void {
        this.propertyToUpdate = property;
        this.showManagePropertyDialog();
    }

    public onClosePropertyDialog(): void {
        this.propertyToUpdate = null;
        this.hideManagePropertyDialog();
    }

    private showManagePropertyDialog(): void {
        this.showAddProperty = true;
    }

    private hideManagePropertyDialog(): void {
        this.showAddProperty = false;
    }
}