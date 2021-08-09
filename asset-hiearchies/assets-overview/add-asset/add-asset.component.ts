import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CdkStep } from '@angular/cdk/stepper';
import { ActionControl, BuiltInActionType, BulkActionControl, C8yJSONSchema, C8yStepper, gettext, Pagination } from '@c8y/ngx-components';
import { IManagedObject, IResultList, IResult } from '@c8y/client';
import { Asset } from '../asset.model';
import { AddAssetService } from './add-asset.service';
import { get, has, keys } from 'lodash-es';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { JSONSchema7 } from 'json-schema';

@Component({
    selector: 'c8y-add-asset',
    templateUrl: './add-asset.component.html'
})

export class AddAssetComponent implements OnInit, OnChanges {

    readonly ITEMS_SELECT_LIMIT = 15;

    @Input() refresh = new EventEmitter<any>();

    @Input() assetToUpdate: Asset;

    @ViewChild(C8yStepper, { static: false })
    stepper: C8yStepper;

    @Output() onCancel = new EventEmitter<any>();

    assetTypes: IResultList<IManagedObject>;

    formGroupStepOne: FormGroup;

    formGroupStepTwo: FormGroup;

    jsonSchemaFormFields: FormlyFieldConfig[] = [];

    model: object = {};

    pendingStatus: boolean = false;

    selectedDeviceIds: string[] = [];

    pagination: Pagination = { pageSize: 20, currentPage: 1 };

    readonly isSelectable = true;

    refreshAssignedDevicesList: EventEmitter<any> = new EventEmitter();

    baseQuery;

    bulkActionControlsAssignedDevices: BulkActionControl[] = [
        {
            type: 'UNASSIGN',
            icon: 'unlink',
            text: gettext('Unassign'),
            callback: selectedItemIds => this.onUnassignDevices(selectedItemIds)
        }
    ];

    actionControlsAssignedDevices: ActionControl[] = [
        {
            type: 'UNASSIGN',
            icon: 'unlink',
            text: gettext('Unassign'),
            callback: (device: IManagedObject) => this.onUnassignDevice(device)
        }
    ];

    constructor(private formBuilder: FormBuilder, private addAssetService: AddAssetService) {

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.hasOwnProperty('assetToUpdate') && changes['assetToUpdate'].currentValue) {
            this.assetToUpdate = Object.assign(new Asset(), changes['assetToUpdate'].currentValue);
        }
    }

    ngOnInit(): void {
        this.initFormOne();
        this.initFormTwo();
        this.initAssetTypes();
        this.initAssignedDevicesBaseQuery();
    }

    initFormOne(): void {
        this.formGroupStepOne = this.formBuilder.group({
            name: [this.isAssetUpdate() ? this.assetToUpdate['name'] : '', Validators.required],
            description: [this.isAssetUpdate() ? this.assetToUpdate['description'] : ''],
            type: new FormControl(null),
        });
    }

    initFormTwo(): void {
        this.formGroupStepTwo = new FormGroup({});
    }

    async initAssetTypes(): Promise<void> {
        this.assetTypes = await this.addAssetService.queryAssetTypes();

        if (this.isAssetUpdate()) {
            const assetTypeSelected: IManagedObject = this.assetTypes.data.find((assetType) => assetType.name === this.assetToUpdate.getType());
            this.formGroupStepOne.patchValue({ type: assetTypeSelected });
        }
    }

    initAssignedDevicesBaseQuery(): void {
        if (!this.isAssetUpdate()) {
            return;
        }

        if (!this.assetToUpdate.childAssets || !this.assetToUpdate.childAssets.references
            || this.assetToUpdate.childAssets.references.length === 0) {
            return;
        }

        this.baseQuery = {
            __or: []
        };

        this.assetToUpdate.childAssets.references.forEach(reference => this.baseQuery.__or.push({ __eq: { id: reference.managedObject.id } }));
    }

    async onNextStepTwo(event: { stepper: C8yStepper, step: CdkStep }) {
        event.stepper.next();
        this.jsonSchemaFormFields = await this.addAssetService.loadPropertiesJsonSchemas(this.formGroupStepOne.value)

        if (this.isAssetUpdate()) {
            // brief timeout necessary to ensure formGroupStepTwo has been initialized
            setTimeout(() => {
                Object.keys(this.formGroupStepTwo.value).forEach((key) => {
                    if (this.assetToUpdate.hasOwnProperty(key)) {
                        this.formGroupStepTwo.patchValue({ [key]: this.assetToUpdate[key] });
                    }
                });
            }, 100);
        }
    }

    onSelected(selectedDevicesIds: string[]) {
        this.selectedDeviceIds = selectedDevicesIds;
    }

    isAssetUpdate(): boolean {
        return !!this.assetToUpdate;
    }

    async updateAsset(): Promise<void> {
        this.pendingStatus = true;

        await this.addAssetService.updateAsset(this.assetToUpdate.id, this.getAssetRepresentation(this.formGroupStepOne.value, this.model), this.selectedDeviceIds);

        this.resetStepper();
        this.emitEvents();
    }

    async createAsset(): Promise<void> {
        this.pendingStatus = true;

        await this.addAssetService.createAsset(this.getAssetRepresentation(this.formGroupStepOne.value, this.model), this.selectedDeviceIds);

        this.resetStepper();
        this.emitEvents();
    }

    onUnassignDevices(deviceIds: string[]) {
        console.log('onUnassignDevices');
    }

    onUnassignDevice(device: IManagedObject) {
        this.addAssetService.unassignDeviceFromAsset(this.assetToUpdate.id, device.id).then(() => {
            if (!this.baseQuery.__or || this.baseQuery.__or.length === 0) {
                return;
            }

            this.baseQuery.__or = this.baseQuery.__or.filter(param => get(param, '__eq.id') !== device.id);
            this.refreshAssignedDevicesList.emit();

            if (this.baseQuery.__or.length === 0) {
                this.baseQuery = undefined;
            }
        });
    }

    private resetStepper() {
        this.stepper.reset();
        this.stepper.selectedIndex = 1;
        this.selectedDeviceIds = [];
        this.pendingStatus = false;
    }

    private emitEvents() {
        this.onCancel.emit();
        this.refresh.emit();
    }

    private getAssetRepresentation({ name, type, description }, customProperties: object): Partial<IManagedObject> {
        return {
            name,
            type: type.name,
            description,
            ...customProperties
        }
    }
}