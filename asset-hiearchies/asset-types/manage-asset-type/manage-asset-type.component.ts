import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ManageAssetTypeService } from './manage-asset-type.service';
import { IManagedObject, IResultList } from '@c8y/client';

@Component({
    selector: 'c8y-manage-asset-type',
    templateUrl: './manage-asset-type.component.html',
    styleUrls: ['styles.less']
})

export class ManageAssetTypeComponent implements OnInit, OnChanges {
    @Input() assetType: IManagedObject;

    @Input() refresh = new EventEmitter<any>();

    @Output() onClose = new EventEmitter<any>();

    formGroup: FormGroup;

    properties: Promise<IResultList<IManagedObject>>;

    selectedProperties: string[] = [];

    constructor(private formBuilder: FormBuilder, private manageAssetTypeService: ManageAssetTypeService) { }

    ngOnInit() {
        this.initProperties();
        this.initFormGroup();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.hasOwnProperty('assetType')) {
            this.assetType = changes['assetType'].currentValue;
            this.initFormGroup();
        }
    }

    initProperties() {
        this.properties = this.manageAssetTypeService.getProperties();
    }

    initFormGroup() {
        this.selectedProperties = this.isAssetTypeUpdate() ? this.assetType.c8y_IsAssetType.propertyIds : [];
        this.formGroup = this.formBuilder.group({
            name: [this.isAssetTypeUpdate() ? this.assetType.name : '', Validators.required],
            description: [this.isAssetTypeUpdate() ? this.assetType.description : ''],
            properties: ['']
        });
    }

    async onSaveButtonClicked(): Promise<void> {
        await this.saveAssetType();
        this.refresh.emit();
        this.onClose.emit();
    }

    onCancel(): void {
        this.resetForm();
        this.onClose.emit();
    }

    private async saveAssetType(): Promise<void> {
        if (this.isAssetTypeUpdate()) {
            await this.manageAssetTypeService.updateAssetType(this.assetType.id, this.formGroup.value.name,
                this.formGroup.value.description, this.formGroup.value.properties);
        } else {
            await this.manageAssetTypeService.createAssetType(this.formGroup.value.name,
                this.formGroup.value.description, this.formGroup.value.properties);
        }
    }

    private resetForm() {
        this.assetType = null;
    }

    public isAssetTypeUpdate(): boolean {
        return !!this.assetType;
    }
}