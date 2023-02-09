import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { InventoryService, IManagedObject, IResultList } from '@c8y/client';

@Injectable()
export class DeviceSelectorModalService {

    private readonly LIST_FILTER = {
        pageSize: 25,
        withTotalPages: true
    };

    constructor(private inventoryService: InventoryService) {

    }

    queryDevices(deviceName?: string): Promise<IResultList<IManagedObject>> {
        let searchString = deviceName ? `*${deviceName}*` : '*';
        return this.inventoryService.listQuery({ __filter: { __and: [{ __or: [{__has: 'c8y_IsDevice' }, {__has: 'c8y_IsAsset'  } ]}, { name: searchString }] } }, this.LIST_FILTER);
    }
}