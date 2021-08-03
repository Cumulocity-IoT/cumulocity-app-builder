import { Injectable } from '@angular/core';
import { InventoryService, IManagedObject, IResultList, IResult } from '@c8y/client';

@Injectable({ providedIn: 'root' })
export class ManageAssetTypeService {
    constructor(private inventoryService: InventoryService) { }

    getProperties(): Promise<IResultList<IManagedObject>> {
        return this.inventoryService.list({ fragmentType: 'c8y_JsonSchema', pageSize: 2000 });
    }

    createAssetType(name: string, description: string, propertyIds: string[]): Promise<IResult<IManagedObject>> {
        return this.inventoryService.create(this.getAssetTypeRepresentation(name, description, propertyIds));
    }

    updateAssetType(id: string, name: string, description: string, propertyIds: string[]): Promise<IResult<IManagedObject>> {
        return this.inventoryService.update({ id, ... this.getAssetTypeRepresentation(name, description, propertyIds) });
    }

    private getAssetTypeRepresentation(name: string, description: string, propertyIds: string[]): Partial<IManagedObject> {
        return {
            name,
            description,
            c8y_IsAssetType: {
                propertyIds
            },
        }
    }
}