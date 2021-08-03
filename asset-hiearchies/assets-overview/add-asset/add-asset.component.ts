import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

export class AddAssetComponent implements OnInit {

    readonly ITEMS_SELECT_LIMIT = 15;

    @Input() refresh = new EventEmitter<any>();

    @Input() assetToUpdate: IManagedObject;

    @ViewChild(C8yStepper, { static: false })
    stepper: C8yStepper;

    @Output() onCancel = new EventEmitter<any>();

    assetTypePromise: Promise<IResultList<IManagedObject>>;

    assetToCreate: Asset;

    formGroupStepOne: FormGroup;

    formGroupStepTwo: FormGroup;

    jsonSchemaFormFields: FormlyFieldConfig[] = [];

    model = {};

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

    ngOnInit(): void {
        this.initFormOne();
        this.initFormTwo();
        this.initAssetTypes();
        this.initAssignedDevicesBaseQuery();
    }

    // initForm(): void {
    //     this.formGroupStepOne = this.formBuilder.group({
    //         name: [this.isAssetUpdate() ? this.assetToUpdate['name'] : '', Validators.required],
    //         type: [this.isAssetUpdate() ? this.assetToUpdate['type'] : '', Validators.required],
    //         description: [this.isAssetUpdate() ? this.assetToUpdate['description'] : ''],
    //         externalAssetId: [this.isAssetUpdate() ? this.assetToUpdate['c8y_ExternalAssetId'] : ''],
    //         ownerName: [this.isAssetUpdate() ? get(this.assetToUpdate, 'c8y_AssetOwner.name') : ''],
    //         ownerEmail: [this.isAssetUpdate() ? get(this.assetToUpdate, 'c8y_AssetOwner.email') : '']
    //     });
    // }

    initFormOne(): void {
        this.formGroupStepOne = this.formBuilder.group({
            name: [this.isAssetUpdate() ? this.assetToUpdate['name'] : '', Validators.required],
            description: [this.isAssetUpdate() ? this.assetToUpdate['description'] : ''],
            type: [''],
        });
    }

    initFormTwo(): void {
        this.formGroupStepTwo = new FormGroup({});
    }

    initAssetTypes(): void {
        this.assetTypePromise = this.addAssetService.queryAssetTypes();
    }

    initAssignedDevicesBaseQuery(): void {
        if (!this.isAssetUpdate()) {
            return;
        }

        if (!this.assetToUpdate.childDevices || !this.assetToUpdate.childDevices.references
            || this.assetToUpdate.childDevices.references.length === 0) {
            return;
        }

        this.baseQuery = {
            __or: []
        };

        this.assetToUpdate.childDevices.references.forEach(reference => this.baseQuery.__or.push({ __eq: { id: reference.managedObject.id } }));
    }

    async onNextStepTwo(event: { stepper: C8yStepper, step: CdkStep }) {
        event.stepper.next();
        this.jsonSchemaFormFields = await this.addAssetService.loadPropertiesJsonSchemas(this.formGroupStepOne.value)
    }

    onSelected(selectedDevicesIds: string[]) {
        this.selectedDeviceIds = selectedDevicesIds;
    }

    isAssetUpdate(): boolean {
        return (this.assetToUpdate != undefined && this.assetToUpdate != null);
    }

    async updateAsset(): Promise<void> {
        // this.pendingStatus = true;

        // await this.addAssetService.updateAsset(this.assetToUpdate.id, this.getAssetRepresentation(this.formGroupStepOne.value), this.selectedDeviceIds);

        // this.resetStepper();
        // this.emitEvents();
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

    private getAssetRepresentation({ name, type, description }, customProperties: object): Asset {
        return {
            name,
            type: type.name,
            description,
            ...customProperties
        }
    }
}