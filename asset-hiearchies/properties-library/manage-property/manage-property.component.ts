import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { C8yJSONSchema, C8yStepper } from '@c8y/ngx-components';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CdkStep } from '@angular/cdk/stepper';
import { IManagedObject } from '@c8y/client';
import { JSONSchema7 } from 'json-schema';
import { PropertiesLibraryManagePropertyService } from './manage-property.service';
import { CustomProperty } from './property.model';

@Component({
    selector: 'c8y-properties-library-manage-property',
    templateUrl: './manage-property.component.html',
    styleUrls: ['styles.less'],
    encapsulation: ViewEncapsulation.None // TODO remove this
})
export class PropertiesLibraryManagePropertyComponent implements OnInit, OnChanges {

    @Input() property: CustomProperty;

    @Input() refresh: EventEmitter<any> = new EventEmitter();

    @ViewChild(C8yStepper, { static: false })
    stepper: C8yStepper;

    @Output() onClose = new EventEmitter<any>();


    formGroupStepOne: FormGroup;

    formGroupStepTwo: FormGroup;

    pendingStatus: boolean = false;

    dynamicFormTwo: FormlyFieldConfig[] = [];

    jsonSchemaFormFields: FormlyFieldConfig[] = [];

    formGroupJsonSchema: FormGroup;

    model = {};

    constructor(
        private formBuilder: FormBuilder,
        public jsonschema: C8yJSONSchema,
        private propertyLibraryService: PropertiesLibraryManagePropertyService) { }

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.initFormStepOne();
        this.initFormStepTwo();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.hasOwnProperty('property') && changes['property'].currentValue) {
            this.property = Object.assign(new CustomProperty(), changes['property'].currentValue);
            this.initForm();
        }
    }

    initFormStepOne(): void {
        this.formGroupStepOne = this.formBuilder.group({
            name: [this.isUpdateExistingProperty() ? this.property.name : ''],
            description: [this.isUpdateExistingProperty() ? this.property.description : ''],
            isComplex: [this.isUpdateExistingProperty() ? this.property.isComplex() : false]
        });
    }

    initFormStepTwo(): void {
        if (this.isUpdateExistingProperty()) {
            this.formGroupStepTwo = this.formBuilder.group({
                root: [this.property.isComplex() ? this.property.getRootName() : '', Validators.required]
            });
            this.initPropertyStructure();
        } else {
            this.formGroupStepTwo = this.formBuilder.group({
                root: ['', Validators.required]
            });
            this.formGroupJsonSchema = new FormGroup({});
            this.jsonSchemaFormFields = [];
        }
    }

    initPropertyStructure(): void {
        if (!this.isUpdateExistingProperty()) {
            throw new Error('Property isn\'t set');
        }

        let properties = this.property.c8y_JsonSchema.properties as object;
        Object.keys(properties).forEach(propertyKey => {
            const property = properties[propertyKey];
            this.addExistingPropertyConfigurationToForm(property.title, propertyKey, property.type, property.default);
        });
    }

    getPreviewModel(model: object): object {
        return this.propertyLibraryService.getPreviewModel(model, this.formGroupStepOne.value.isComplex,
            this.formGroupStepTwo.value.root);
    }

    async onSaveClicked(): Promise<void> {
        if (this.isUpdateExistingProperty()) {
            await this.updateProperty();
        } else {
            await this.createProperty();
        }
    }

    async updateProperty(): Promise<void> {
        const { data, res } = await this.propertyLibraryService.updatePropertyInInventory(this.property.id,
            this.formGroupStepOne.value.name,
            this.formGroupStepOne.value.description, this.formGroupStepOne.value.isComplex,
            this.model, this.formGroupStepTwo.value.root);

        this.closeStepper();
    }

    async createProperty(): Promise<void> {
        const { data, res } = await this.propertyLibraryService.createPropertyInInventory(this.formGroupStepOne.value.name,
            this.formGroupStepOne.value.description, this.formGroupStepOne.value.isComplex,
            this.model, this.formGroupStepTwo.value.root);

        this.closeStepper();
    }

    isComplexProperty(): boolean {
        return this.formGroupStepOne && this.formGroupStepOne.value.isComplex;
    }

    addAdditionalPropertyConfigurationToForm(): void {
        this.dynamicFormTwo = [...this.dynamicFormTwo, this.propertyLibraryService.getForm(this.dynamicFormTwo.length)];
    }

    addExistingPropertyConfigurationToForm(name: string, label: string, type: string, defaultValue: string): void {
        this.dynamicFormTwo = [
            ...this.dynamicFormTwo,
            this.propertyLibraryService.getFormElement(this.dynamicFormTwo.length, name, label, type, defaultValue)
        ];
    }

    public onAddPropertyButtonClicked(): void {
        this.addAdditionalPropertyConfigurationToForm();
    }

    public onNextSelected(event: { stepper: C8yStepper, step: CdkStep }): void {
        if (!this.isUpdateExistingProperty()) {
            this.addAdditionalPropertyConfigurationToForm();
        }

        event.stepper.next();
    }

    public onBackSelected(event: { stepper: C8yStepper, step: CdkStep }): void {
        this.resetForm();
        event.stepper.previous();
    }

    public onCancelClicked(): void {
        this.resetForm();
        this.resetStepper();
        this.onClose.emit();
    }

    public isUpdateExistingProperty(): boolean {
        return !!this.property;
    }

    private resetStepper(): void {
        this.stepper.reset();
        this.stepper.selectedIndex = 0;
        this.pendingStatus = false;
    }

    private resetForm(): void {
        this.property = null;
        this.model = {};
        this.dynamicFormTwo = [];
        this.initFormStepTwo();
    }

    private closeStepper(): void {
        this.resetForm();
        this.resetStepper();
        this.onClose.emit();
        this.refresh.emit();
    }
}