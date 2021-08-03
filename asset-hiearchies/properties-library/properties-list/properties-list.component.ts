import { EventEmitter, Output } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { ActionControl, BuiltInActionType, BulkActionControl, Column } from '@c8y/ngx-components';
import { IManagedObject } from '@c8y/client';
import { PropertiesLibraryListService } from './properties-list.service';

@Component({
    selector: 'c8y-properties-library-list',
    templateUrl: './properties-list.component.html'
})

export class PropertiesLibraryListComponent implements OnInit {
    @Input() refresh: EventEmitter<any> = new EventEmitter();

    @Output() onEditEntry: EventEmitter<IManagedObject> = new EventEmitter();

    actionControls: ActionControl[] = [
        { type: BuiltInActionType.Edit, callback: (item: IManagedObject) => this.onEditProperty(item) },
        { type: BuiltInActionType.Delete, callback: (item: IManagedObject) => this.onDeleteSelectedProperty(item) }
    ];

    bulkActionControls: BulkActionControl[] = [
        { type: BuiltInActionType.Delete, callback: selectedItemIds => this.onDeleteSelectedProperties(selectedItemIds) }
    ];

    columns: Column[] = [
        {
            name: 'name',
            header: 'Name',
            path: 'name',
            filterable: true,
        }
    ];


    constructor(public propertiesListService: PropertiesLibraryListService) {
    }

    ngOnInit() {
    }

    private async onDeleteSelectedProperty(entry: IManagedObject): Promise<void> {
        await this.propertiesListService.deleteProperty(entry.id);
        this.refresh.emit();
    }

    private async onDeleteSelectedProperties(selectedIds: string[]): Promise<void> {
        await this.propertiesListService.deleteProperties(selectedIds);
        this.refresh.emit();
    }

    private async onEditProperty(entry: IManagedObject): Promise<void> {
        this.onEditEntry.emit(entry);
    }

}