import { IManagedObject, IManagedObjectReferences } from '@c8y/client';

export class CustomProperty implements IManagedObject {
    [key: string]: any;
    creationTime: string;
    id: string;
    lastUpdated: string;
    owner: string;
    self: string;
    additionParents: IManagedObjectReferences;
    assetParents: IManagedObjectReferences;
    childAdditions: IManagedObjectReferences;
    childAssets: IManagedObjectReferences;
    childDevices: IManagedObjectReferences;
    deviceParents: IManagedObjectReferences;

    c8y_PropertyDescription: {
        isComplexProperty: boolean;
        model: object;
    };

    c8y_JsonSchema: {
        key?: string;
        title: string;
        properties: object;
    }

    isComplex(): boolean {
        return this.c8y_PropertyDescription.isComplexProperty;
    }

    getRootName(): string {
        return this.c8y_JsonSchema.key;
    }
}