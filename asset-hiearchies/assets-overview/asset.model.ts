import { IManagedObject, IManagedObjectReferences } from '@c8y/client';

export class Asset implements IManagedObject {
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

    public getType(): string {
        return this['type'];
    }
}