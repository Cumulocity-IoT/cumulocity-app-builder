import { Injectable } from '@angular/core';
import { AddAssetService } from '../add-asset/add-asset.service';
import { csv2jsonAsync } from 'json-2-csv';
import { DroppedFile } from '@c8y/ngx-components';

@Injectable({ providedIn: 'root' })
export class ImportAssetsService {
    constructor(private addAssetService: AddAssetService) { }

    async importAssetFromCSV(file: DroppedFile): Promise<void> {
        const promisses: Promise<void>[] = [];
        const content: string = await file.readAsText();
        const assetsJson = await csv2jsonAsync(content, {});

        assetsJson.forEach((asset: object) => {
            let deviceIdsToAssign = [];

            if (asset.hasOwnProperty('relatedDevices')) {
                const relatedDevices = asset['relatedDevices'].toString();
                deviceIdsToAssign = !relatedDevices ? [] : relatedDevices.split(',');
                delete asset['relatedDevices'];
            }

            promisses.push(this.addAssetService.createAsset(asset, deviceIdsToAssign));
        });

        await Promise.all(promisses);
    }
}