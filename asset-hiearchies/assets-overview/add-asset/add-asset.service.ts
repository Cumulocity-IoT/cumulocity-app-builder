import { Injectable } from '@angular/core';
import { InventoryService } from '@c8y/ngx-components/api';
import { IResult, IResultList, IIdentified, IManagedObject } from '@c8y/client';
import { get, has, keys } from 'lodash-es';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { C8yJSONSchema } from '@c8y/ngx-components';
import { JSONSchema7 } from 'json-schema';

@Injectable()
export class AddAssetService {
    constructor(private inventory: InventoryService, private jsonschema: C8yJSONSchema) { }

    async createAsset(asset: Partial<IManagedObject>, deviceIds: string[]): Promise<void> {
        if (!asset) {
            return;
        }

        const assetManagedObject = (await this.inventory.create({ ...asset, c8y_IsAsset: {} })).data;
        await this.assignDevicesToAsset(assetManagedObject.id, deviceIds);
    }

    async updateAsset(assetId: string, asset: Partial<IManagedObject>, deviceIds: string[]): Promise<void> {
        if (!asset) {
            return;
        }

        const assetManagedObject = (await this.inventory.update({ id: assetId, ...asset })).data;
        await this.assignDevicesToAsset(assetManagedObject.id, deviceIds);
    }

    private async assignDevicesToAsset(assetId: string, deviceIds: string[]) {
        if (!deviceIds || deviceIds.length === 0) {
            return;
        }

        const promisses: Promise<IResult<IIdentified>>[] = [];
        deviceIds.forEach(deviceId => promisses.push(this.inventory.childDevicesAdd(deviceId, assetId)));

        return Promise.all(promisses);
    }

    async unassignDeviceFromAsset(assetId: string, deviceId: string): Promise<void> {
        if (!assetId || assetId.length === 0 || !deviceId || deviceId.length === 0) {
            return;
        }

        await this.inventory.childDevicesRemove(deviceId, assetId);
    }

    async queryAssetTypes(): Promise<IResultList<IManagedObject>> {
        return this.inventory.list({ fragmentType: 'c8y_IsAssetType' });
    }

    async getPropertyJsonSchema(jsonSchemaId: string): Promise<IResult<IManagedObject>> {
        return this.inventory.detail(jsonSchemaId);
    }

    async loadPropertiesJsonSchemas({ type }): Promise<FormlyFieldConfig[]> {
        if (!has(type, 'c8y_IsAssetType.propertyIds')) {
            throw new Error('Failed to load JsonSchema');
        }

        let jsonSchemaFormFields: FormlyFieldConfig[] = [];
        let jsonSchemaIds: string[] = get(type, 'c8y_IsAssetType.propertyIds');
        let promisses: Promise<IResult<IManagedObject>>[] = [];
        jsonSchemaIds.forEach((id) => promisses.push(this.getPropertyJsonSchema(id)));

        const responses: IResult<IManagedObject>[] = await Promise.all(promisses);

        responses.forEach((response) => {
            if (!response.data) {
                return;
            }

            let jsonSchema = response.data;
            let formField: FormlyFieldConfig = this.jsonschema.toFieldConfig(jsonSchema.c8y_JsonSchema as JSONSchema7, {
                map(mappedField: FormlyFieldConfig, mapSource: JSONSchema7) {
                    let result: FormlyFieldConfig = mappedField;
                    if (has(mapSource, 'key')) {
                        result = {
                            ...result,
                            key: get(mapSource, 'key')
                        };
                    }

                    if (result.fieldGroup) {
                        result.fieldGroup.push({
                            key: '_schemaId',
                            type: 'input',
                            hideExpression: 'true',
                            defaultValue: jsonSchema.id
                        });
                    }

                    return result;
                }
            });

            jsonSchemaFormFields = [
                ...jsonSchemaFormFields,
                formField
            ];
        });

        return jsonSchemaFormFields;
    }
}