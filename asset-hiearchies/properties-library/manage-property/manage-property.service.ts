import { Injectable } from '@angular/core';
import { InventoryService, IManagedObject, IResult } from '@c8y/client';
import { FormlyFieldConfig } from '@ngx-formly/core';

@Injectable({ providedIn: 'root' })
export class PropertiesLibraryManagePropertyService {
    constructor(private inventoryService: InventoryService) { }


    getForm(index: number): object {
        return {
            key: `property-${index}`,
            fieldGroupClassName: 'row',
            fieldGroup: [
                {
                    className: 'col-lg-6',
                    type: 'input',
                    key: 'name',
                    templateOptions: {
                        label: 'Name',
                    },
                },
                {
                    className: 'col-lg-6',
                    type: 'input',
                    key: 'label',
                    templateOptions: {
                        label: 'Label',
                    },
                },
                {
                    className: 'col-lg-3',
                    type: 'select',
                    key: 'dataType',
                    defaultValue: 'input',
                    templateOptions: {
                        label: 'Type',
                        options: [{ value: 'input', label: 'Text' }, { value: 'number-ext', label: 'Number' }],
                        selected: 'input'
                    },
                },
                {
                    className: 'col-lg-3',
                    type: 'dynamic-input',
                    fieldGroup: [{
                        key: 'default',
                        type: 'input',
                        templateOptions: {
                            label: 'Default Value'
                        },
                        expressionProperties: {
                            'type': (model: any, formState: any, field: FormlyFieldConfig) => {
                                return (model.dataType) ? model.dataType : 'input';
                            },
                        },
                    }],
                },
                {
                    className: 'col-lg-6',
                    key: 'required',
                    type: 'checkbox',
                    templateOptions: {
                        label: 'Required'
                    }
                }
            ],
        }
    }

    getFormElement(index: number, name: string, label: string, type: string, defaultValue: string): object {
        return {
            key: `property-${index}`,
            fieldGroupClassName: 'row',
            fieldGroup: [
                {
                    className: 'col-lg-6',
                    type: 'input',
                    key: 'name',
                    defaultValue: `${name}`,
                    templateOptions: {
                        label: 'Name',
                    },
                },
                {
                    className: 'col-lg-6',
                    type: 'input',
                    key: 'label',
                    defaultValue: `${label}`,
                    templateOptions: {
                        label: 'Label',
                    },
                },
                {
                    className: 'col-lg-3',
                    type: 'select',
                    key: 'dataType',
                    defaultValue: `${type}`,
                    templateOptions: {
                        label: 'Type',
                        options: [{ value: 'input', label: 'Text' }, { value: 'number-ext', label: 'Number' }],
                        selected: `${type}`
                    },
                },
                {
                    className: 'col-lg-3',
                    type: 'dynamic-input',
                    fieldGroup: [{
                        key: 'default',
                        type: `${type}`,
                        defaultValue: `${!!defaultValue ? defaultValue : ''}`,
                        templateOptions: {
                            label: 'Default Value'
                        },
                        expressionProperties: {
                            'type': (model: any, formState: any, field: FormlyFieldConfig) => {
                                return (model.dataType) ? model.dataType : `${type}`;
                            },
                        },
                    }],
                },
                {
                    className: 'col-lg-6',
                    key: 'required',
                    type: 'checkbox',
                    templateOptions: {
                        label: 'Required'
                    }
                }
            ],
        }
    }

    getPreviewModel(model: object, isComplexProperty: boolean, propertyRoot?: string): object {
        let preview = {};

        if (isComplexProperty && propertyRoot) {
            preview[propertyRoot] = {};
        }

        for (const key in model) {
            if (model.hasOwnProperty(key)) {
                const label = model[key]['label'];
                const defaultValue = model[key]['default'];

                if (isComplexProperty && propertyRoot) {
                    if (label) {
                        preview[propertyRoot][label] = (defaultValue) ? defaultValue : "";
                    }
                } else if (label) {
                    preview[label] = (defaultValue) ? defaultValue : "";
                }
            }
        }

        return preview;
    }

    createJSONSchema(name: string, description: string, isComplexProperty: boolean, model: object, propertyRoot?: string): Partial<IManagedObject> {
        let jsonSchemaManagedObject: Partial<IManagedObject> = {
            name,
            description,
            type: 'c8y_JsonSchema',
            c8y_Global: {},
            c8y_JsonSchema: {
                type: 'object',
                title: name,
                properties: this.getJSONSchemaPropertyDescription(model),
                key: propertyRoot,
            },
            c8y_PropertyDescription: {
                isComplexProperty,
                model: this.getModelDescription(isComplexProperty, model, propertyRoot),
            },
        };

        return jsonSchemaManagedObject;
    }

    getModelDescription(isComplexProperty: boolean, model: object, propertyRoot?: string) {
        if (isComplexProperty && propertyRoot) {
            return {
                [propertyRoot]: this.getJSONSchemaModelDescription(model),
            };
        }

        return this.getJSONSchemaModelDescription(model);
    }

    getJSONSchemaPropertyDescription(model: object) {
        let jsonSchemaDescription = {};
        for (const [key, value] of Object.entries(model)) {
            jsonSchemaDescription[value.label] = {
                type: value.dataType,
                default: value.default,
                title: value.name,
            };
        };

        return jsonSchemaDescription;
    }

    getJSONSchemaModelDescription(model: object) {
        let jsonSchemaDescription = {};
        for (const [key, value] of Object.entries(model)) {
            jsonSchemaDescription[value.label] = "";
        };

        return jsonSchemaDescription;
    }

    createPropertyInInventory(name: string, description: string, isComplexProperty: boolean, model: object, propertyRoot?: string): Promise<IResult<IManagedObject>> {
        return this.inventoryService.create(this.createJSONSchema(name, description, isComplexProperty, model, propertyRoot));
    }

    updatePropertyInInventory(id: string, name: string, description: string, isComplexProperty: boolean, model: object, propertyRoot?: string): Promise<IResult<IManagedObject>> {
        return this.inventoryService.update({
            id,
            ...this.createJSONSchema(name, description, isComplexProperty, model, propertyRoot),
        })
    }
}