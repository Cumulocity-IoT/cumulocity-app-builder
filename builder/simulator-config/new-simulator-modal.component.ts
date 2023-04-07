/*
* Copyright (c) 2019 Software AG, Darmstadt, Germany and/or its licensors
*
* SPDX-License-Identifier: Apache-2.0
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
 */

import {
    Component,
    ComponentFactory,
    ComponentFactoryResolver, ComponentRef,
    Injector,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { WizardComponent } from "../../wizard/wizard.component";
import { InventoryService, ApplicationService, IManagedObject, FetchClient } from '@c8y/client';
import { AppIdService } from "../app-id.service";
import { SimulationStrategyConfigComponent, SimulationStrategyFactory } from "../simulator/simulation-strategy";
import { SimulationStrategiesService } from "../simulator/simulation-strategies.service";
import { SimulatorCommunicationService } from "../simulator/mainthread/simulator-communication.service";
import { BehaviorSubject, throwError } from 'rxjs';
import { SimulatorNotificationService } from './simulatorNotification.service';
import { FileSimulatorNotificationService } from './file-simulator.service';
import { AlertService } from '@c8y/ngx-components';
import { UpdateableAlert } from '../../builder/utils/UpdateableAlert';
import { SimulatorWorkerAPI } from '../simulator/mainthread/simulator-worker-api.service';
import { SimulatorConfigService } from './simulator-config.service';
import { AlertMessageModalComponent } from '../../builder/utils/alert-message-modal/alert-message-modal.component';
import { SimulatorManagerService } from '../../builder/simulator/mainthread/simulator-manager.service';

@Component({
    templateUrl: './new-simulator-modal.component.html'
})
export class NewSimulatorModalComponent {
    busy: boolean = false;
    isConfigFileUploading: boolean = false;
    isConfigFileError: boolean = false;

    @ViewChild(WizardComponent, { static: true }) wizard: WizardComponent;

    @ViewChild("configWrapper", { read: ViewContainerRef, static: true }) configWrapper: ViewContainerRef;

    selectedStrategyFactory: SimulationStrategyFactory;
    newConfig: any;
    deviceId: string | undefined;
    simulatorName: string = '';
    deviceName: string | undefined;
    groupName: string | undefined;
    numberOfDevice: number | 0;
    isGroup: boolean = false;
    configFromFile: any;
    runOnServer: boolean = false;
    isMSExist: boolean = false;
    isMSCheckSpin: boolean = false;
    isCSVSimulator: boolean = false;
    showWarning: boolean;

    constructor(
        private simSvc: SimulatorWorkerAPI, private alertService: AlertService,
        public bsModalRef: BsModalRef, public simulationStrategiesService: SimulationStrategiesService,
        private resolver: ComponentFactoryResolver, private injector: Injector, private inventoryService: InventoryService,
        private appService: ApplicationService, private appIdService: AppIdService, private fetchClient: FetchClient,
        private simulatorNotificationService: SimulatorNotificationService, private fileSimulatorNotificationService: FileSimulatorNotificationService,
        private simulatorConfigService: SimulatorConfigService,private modalService: BsModalService,
        private simulatorManagerService: SimulatorManagerService
    ) { }

    async openSimulatorConfig() {
        this.wizard.selectStep('config');

        const metadata = this.selectedStrategyFactory.getSimulatorMetadata();
        if (metadata && metadata.name.includes('File (CSV/JSON)')) {
            this.isCSVSimulator = true;
            this.isMSCheckSpin = true;
            this.isMSExist = await this.fileSimulatorNotificationService.verifyCSVSimulatorMicroServiceStatus();
            this.isMSCheckSpin = false;
            this.simulatorConfigService.setRunOnServer(true);
            this.runOnServer = true;
        } else { await this.verifySimulatorMicroServiceStatus(); }

        this.configWrapper.clear();

        if (metadata.configComponent != null) {
            const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(metadata.configComponent);
            const componentRef: ComponentRef<SimulationStrategyConfigComponent> = this.configWrapper.createComponent(factory);
            componentRef.instance.config = this.newConfig = {};

            if (this.configFromFile === undefined || this.configFromFile === null) {
                componentRef.instance.initializeConfig();
            } else {
                componentRef.instance.initializeConfig(this.configFromFile);
                componentRef.instance.config.deviceName = this.simulatorName;
            }

            this.newConfig = componentRef.instance.config;//TODO: needed after merge? 

            if (componentRef.instance.config.modalSize) {
                this.bsModalRef.setClass(componentRef.instance.config.modalSize);
            }
            this.newConfig.metadata = metadata;
            componentRef.instance.config.isGroup = this.isGroup;
            this.simulatorConfigService.runOnServer$.subscribe((val) => {
                componentRef.instance.config.serverSide = val;
                this.checkIntervalValidation();
            });

        }
    }

    resetDialogSize() {
        this.bsModalRef.setClass('modal-sm');
    }

    public isConfigFromFileUploaded() {
        if (this.configFromFile === undefined || this.configFromFile === null) {
            return false;
        }
        return true;
    }

    async saveAndClose() {
        this.busy = true;

        const metadata = this.selectedStrategyFactory.getSimulatorMetadata();

        // If Flie CSV/JSON simulator then upload binary
        let fileId = '';
        if (this.isCSVSimulator) {
            const uploadAlert = new UpdateableAlert(this.alertService);
            uploadAlert.update("Uploading file...");
            fileId = await (await this.fileSimulatorNotificationService.createBinary(this.newConfig.csvJsonFile)).data.id;
            uploadAlert.close();
            if (!fileId) {
                this.alertService.danger('Unable to upload File!');
                this.busy = false;
                return;
            } else {
                this.newConfig.fileId = fileId;
            }
        }
        // get simulator Name from strategy's deviceName field
        if (metadata.hideSimulatorName) {
            this.simulatorName = this.newConfig.deviceName;
        }
        let device;
        if (!this.deviceId) {
            if (this.isGroup) {
                // Create Group and Devices
                device = await this.AddGroupAndDevices();
                this.deviceName = this.groupName;
                this.deviceId = device.id;
            } else {
                // createDevice
                device = (await this.inventoryService.create({
                    c8y_IsDevice: {},
                    name: this.simulatorName,
                    c8y_RequiredAvailability: {
                        responseInterval: 5
                    }
                })).data;
                this.deviceName = this.simulatorName;
                this.deviceId = device.id;
            }

        } else {
            // getExistingDevice
            // device = (await this.inventoryService.detail(this.deviceId)).data;
        }
        //  this.deviceId = device.id;

        const appId = this.appIdService.getCurrentAppId();
        let appServiceData;
        if (appId) {
            appServiceData = (await this.appService.detail(appId)).data;
        }
        // updateDevice
        const simulators = appServiceData.applicationBuilder.simulators || [];
        const isFirstSimulator = (simulators && simulators.length > 0 ? false: true );
        const simulatorId = Math.floor(Math.random() * 1000000);
        this.newConfig.deviceId = this.deviceId;
        // Added by darpan to sync device id in alternateConfigs
        if (this.newConfig.alternateConfigs && this.newConfig.alternateConfigs.operations &&
            this.newConfig.alternateConfigs.operations.length > 0) {
            this.newConfig.alternateConfigs.operations.forEach(ops => {
                ops.deviceId = this.deviceId;
            });
        }
        this.newConfig.deviceName = this.deviceName;
        this.newConfig.isGroup = this.isGroup;
        let runOnServer;
        this.simulatorConfigService.runOnServer$.subscribe((val) => {
            runOnServer = val;
        });
        const newSimulatorObject = {
            id: simulatorId,
            name: this.simulatorName,
            type: metadata.name,
            config: this.newConfig,
            lastUpdated: new Date().toISOString(),
            serverSide: (runOnServer ? true : false)
        };
        simulators.push(newSimulatorObject);
        appServiceData.applicationBuilder.simulators = simulators;

        await this.appService.update({
            id: appId,
            applicationBuilder: appServiceData.applicationBuilder
        } as any);
        if (this.isCSVSimulator) {
            this.fileSimulatorNotificationService.post({
                id: appId,
                name: appServiceData.name,
                tenant: (appServiceData.owner && appServiceData.owner.tenant && appServiceData.owner.tenant.id ? appServiceData.owner.tenant.id : ''),
                type: appServiceData.type,
                simulator: newSimulatorObject
            });
        } else if (runOnServer) {
            this.simulatorNotificationService.post({
                id: appId,
                name: appServiceData.name,
                tenant: (appServiceData.owner && appServiceData.owner.tenant && appServiceData.owner.tenant.id ? appServiceData.owner.tenant.id : ''),
                type: appServiceData.type,
                simulator: newSimulatorObject
            });
        }

        if(isFirstSimulator) {
            this.simulatorManagerService.initialize();
        }
        // We could just wait for them to refresh, but it's nicer to instantly refresh
        await this.simSvc.checkForSimulatorConfigChanges();

        this.bsModalRef.hide();
    }
    getSelectedDevice(device: any) {
        this.deviceId = device.id;
        this.deviceName = device.name;
    }

    private async AddGroupAndDevices() {
        let group = null;
        group = (await this.inventoryService.create({
            c8y_IsDeviceGroup: {},
            name: this.groupName,
            type: "c8y_DeviceGroup"
        })).data;
        for (let index = 0; index < this.numberOfDevice; index++) {
            const childManageObject: Partial<IManagedObject> = {
                c8y_IsDevice: {},
                name: this.simulatorName + '-' + (index + 1),
                c8y_RequiredAvailability: {
                    responseInterval: 5
                }
            };
            await this.inventoryService.childAssetsCreate(childManageObject, group.id);
        }
        return group;
    }

    fileUploaded(events) {
        this.isConfigFileError = false;
        this.isConfigFileUploading = true;
        const file = events.target.files[0];
        const reader = new FileReader();
        let input = null;
        reader.addEventListener('load', (event: any) => {
            input = event.target.result;
            const validJson = this.isValidJson(input);
            if (validJson) {
                this.selectedStrategyFactory = this.simulationStrategiesService.strategiesByName.get(validJson.type);
                if (this.selectedStrategyFactory === undefined) {
                    this.isConfigFileError = true;
                } else {
                    this.configFromFile = validJson.config;
                    this.simulatorName = validJson.name;
                    this.wizard.selectStep('device');
                }
            } else {
                this.isConfigFileError = true;
                events.srcElement.value = "";
            }
            this.isConfigFileUploading = false;
        });
        if (file) {
            reader.readAsText(file);
        } else {
            this.configFromFile = null;
            this.isConfigFileUploading = false;
        }
    }

    /**
     *
     * @param input Validate JSON Input
     */
    private isValidJson(input: any) {
        try {
            if (input) {
                const o = JSON.parse(input);
                if (o && (o.constructor === Object || o.constructor === Array)) {
                    return o;
                }
            }
        } catch (e) { }
        return false;
    }

    private async verifySimulatorMicroServiceStatus() {
        this.isMSCheckSpin = true;
        const response = await this.fetchClient.fetch('service/simulator-app-builder/health');
        const data = await response.json()
        if (data && data.status && data.status === "UP") {
            this.isMSExist = true;
            this.simulatorConfigService.setRunOnServer(true);
            this.runOnServer = true;
        }
        else { this.isMSExist = false; }
        this.isMSCheckSpin = false;
    }

    async toggleRunOnServer() {
        if (!this.runOnServer) {
            const alertMessage = {
                title: 'Confirmation',
                description: `You are about to switch simulator as browser based. Browser based simulator will run till your browser is active and may impact on application performance in a long run.
                Do you want to proceed ?`,
                type: 'warning',
                alertType: 'confirm', //info|confirm
                confirmPrimary: false //confirm Button is primary
            }
            const confirmDialog = this.alertModalDialog(alertMessage);
            await confirmDialog.content.event.subscribe(async data => {
                if (data && data.isConfirm) {
                    this.simulatorConfigService.setRunOnServer(this.runOnServer);
                    this.checkIntervalValidation();
                } else {
                    this.runOnServer = true;
                    this.simulatorConfigService.setRunOnServer(true);
                }
            });
        } else {
            this.simulatorConfigService.setRunOnServer(this.runOnServer);
        }
    }

    private alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    checkIntervalValidation() {
        let serverSide;
        this.simulatorConfigService.runOnServer$.subscribe((val) => {
            serverSide = val;
            if (!serverSide && this.newConfig.interval < 30) {
                this.newConfig.intervalInvalid = true;
            } else {
                this.newConfig.intervalInvalid = false;
            }
        });
    }
}
