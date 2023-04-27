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
    ComponentFactoryResolver,
    Injector,
    ViewChild,
    ViewContainerRef,
    OnInit,
    ComponentFactory,
    ComponentRef
} from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import {ApplicationService, FetchClient} from '@c8y/client';
import {AppIdService} from "../app-id.service";
import {SimulatorConfig} from "../simulator/simulator-config";
import {SimulationStrategiesService} from "../simulator/simulation-strategies.service";
import {SimulatorCommunicationService} from "../simulator/mainthread/simulator-communication.service";
import * as _ from 'lodash';
import { SimulatorNotificationService } from './simulatorNotification.service';
import { FileSimulatorNotificationService } from './file-simulator.service';
import { SimulatorWorkerAPI } from '../simulator/mainthread/simulator-worker-api.service';
import { SimulatorConfigService } from './simulator-config.service';
import { AlertMessageModalComponent } from '../../builder/utils/alert-message-modal/alert-message-modal.component';
import { SimulationStrategyConfigComponent } from '../../builder/simulator/simulation-strategy';

@Component({
    templateUrl: './edit-simulator-modal.component.html'
})
export class EditSimulatorModalComponent implements OnInit {
    busy: boolean = false;
    @ViewChild("configWrapper", { read: ViewContainerRef, static: true }) configWrapper: ViewContainerRef;
    simulatorConfig: SimulatorConfig;

    isMSExist: boolean = false;
    isMSCheckSpin: boolean = false;
    isCSVSimulator: boolean = false;
    showWarning: boolean;
    constructor(
        private simSvc: SimulatorWorkerAPI, private simConfigService: SimulatorConfigService,
        public bsModalRef: BsModalRef, private simulationStrategiesService: SimulationStrategiesService,
        private resolver: ComponentFactoryResolver, private injector: Injector,
        private appService: ApplicationService, private appIdService: AppIdService, private fetchClient: FetchClient,
        private simulatorNotificationService: SimulatorNotificationService,
        private fileSimulatorNotificationService: FileSimulatorNotificationService, private modalService: BsModalService
    ) {}

    ngOnInit() {
        this.openSimulatorConfig();
    }

    async openSimulatorConfig() {
        const strategyFactory = this.simulationStrategiesService.strategiesByName.get(this.simulatorConfig.type);
        if (strategyFactory == undefined) {
            console.error("Unknown simulator strategy:", this.simulatorConfig.type);
            this.bsModalRef.hide();
            return;
        }

        const metadata = strategyFactory.getSimulatorMetadata();
        
        if(metadata && metadata.name.includes('File (CSV/JSON)')) {
            this.isCSVSimulator = true;
            this.isMSCheckSpin = true;
            this.isMSExist = await this.fileSimulatorNotificationService.verifyCSVSimulatorMicroServiceStatus();
            this.isMSCheckSpin = false;
        } else { this.verifySimulatorMicroServiceStatus(); }

        // For exisitng simulators
        if(this.simulatorConfig.config && !this.simulatorConfig.config.deviceName) {
            this.simulatorConfig.config.deviceName = this.simulatorConfig.config.deviceId;
        }
        
       

        this.configWrapper.clear();
        
        if (metadata.configComponent != null) {
            const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(metadata.configComponent);
            const componentRef: ComponentRef<SimulationStrategyConfigComponent> = this.configWrapper.createComponent(factory);
            componentRef.instance.config = this.simulatorConfig.config;

            //existing config - check for new operations - config on simulator config
            if( metadata.name != "DTDL" ){
                if( !_.has(componentRef.instance.config,"alternateConfigs")) {
                    let defConfig = _.cloneDeep(componentRef.instance.config);
                    _.set(defConfig, "matchingValue","default");
                    //initialize it if it doesn't exist
                    _.set(componentRef.instance.config,"alternateConfigs", {});
                    _.set(componentRef.instance.config,"alternateConfigs.opEnabled", false);
                    _.set(componentRef.instance.config,"alternateConfigs.opSource", "");
                    _.set(componentRef.instance.config,"alternateConfigs.opSourceName", "")
                    _.set(componentRef.instance.config,"alternateConfigs.payloadFragment", "c8y_Command.text")
                    _.set(componentRef.instance.config,"alternateConfigs.opReply", false)
                    _.set(componentRef.instance.config,"alternateConfigs.configIndex", 0)
                    _.set(componentRef.instance.config,"alternateConfigs.operations", [])
                    _.get(componentRef.instance.config,"alternateConfigs.operations").push(defConfig); //default                
                }    
            } else {
                
                for (const model of componentRef.instance.config.dtdlModelConfig) {
                    if( !_.has(model,"alternateConfigs")) {
                        let defConfig = _.cloneDeep(model);
                        _.set(defConfig, "matchingValue","default");
                        //initialize it if it doesn't exist
                        _.set(model,"alternateConfigs", {});
                        _.set(model,"alternateConfigs.opEnabled", false);
                        _.set(model,"alternateConfigs.opSource", "");
                        _.set(model,"alternateConfigs.opSourceName", "")
                        _.set(model,"alternateConfigs.payloadFragment", "c8y_Command.text")
                        _.set(model,"alternateConfigs.opReply", false)
                        _.set(model,"alternateConfigs.configIndex", 0)
                        _.set(model,"alternateConfigs.operations", [])
                        _.get(model,"alternateConfigs.operations").push(defConfig); //default                
                    }                        
                }
                
            }

            //Accessing EditMode variable in simulator strategy
            componentRef.instance.config.isEditMode = true; 
            this.simulatorConfig.metadata = metadata;
            this.simConfigService.runOnServer$.subscribe((val) => {
                this.simulatorConfig.serverSide = val;
                componentRef.instance.config.serverSide = val;
                this.checkIntervalValidation();
            });
        }
    }

    resetDialogSize() {
        this.bsModalRef.setClass('modal-sm');
    }
    async saveAndClose() {
        this.busy = true;
        let app = (await this.appService.detail(this.appIdService.getCurrentAppId())).data as any;

        let matchingIndex = app.applicationBuilder.simulators
            .findIndex(x => x.id == this.simulatorConfig.id);
        
        this.simulatorConfig.lastUpdated = new Date().toISOString();

        // Patch Fix for alternate config
        if(this.simulatorConfig.config.alternateConfigs && this.simulatorConfig.config.alternateConfigs.operations && 
            this.simulatorConfig.config.alternateConfigs.operations.length > 0) {
            this.simulatorConfig.config.alternateConfigs.operations.forEach( ops => {
                ops.deviceId = this.simulatorConfig.config.deviceId;
            });
        }

        if (matchingIndex > -1) {
            app.applicationBuilder.simulators[matchingIndex] = this.simulatorConfig;
        } else {
            app.applicationBuilder.simulators.push(this.simulatorConfig)
        }

        await this.appService.update({
            id: app.id,
            applicationBuilder: app.applicationBuilder
        } as any);

        if(this.isCSVSimulator) {
            this.fileSimulatorNotificationService.post({
                id: app.id,
                name: app.name,
                tenant: (app.owner && app.owner.tenant && app.owner.tenant.id ? app.owner.tenant.id : ''),
                type: app.type,
                simulator: this.simulatorConfig
             })
        } else if (this.simulatorConfig.serverSide) {
            this.simulatorNotificationService.post({
                id: app.id,
                name: app.name,
                tenant: (app.owner && app.owner.tenant && app.owner.tenant.id ? app.owner.tenant.id : ''),
                type: app.type,
                simulator: this.simulatorConfig
            });
        }
        
        // We could just wait for them to refresh, but it's nicer to instantly refresh
        await this.simSvc.checkForSimulatorConfigChanges();

        this.bsModalRef.hide();
    }

    getSelectedDevice(device: any) {
        this.simulatorConfig.config.deviceId = device.id;
        this.simulatorConfig.config.deviceName = device.name;
    }
    cancelEdit() {
        this.bsModalRef.hide();
    }

    private async verifySimulatorMicroServiceStatus() {
        this.isMSCheckSpin = true;
        const response = await this.fetchClient.fetch('service/simulator-app-builder/health'); 
        const data = await response.json()
        if(data && data.status && data.status === "UP") {
            this.isMSExist = true;
            if (this.simulatorConfig.serverSide) {
                this.simConfigService.setRunOnServer(this.simulatorConfig.serverSide);
            }
        }
        else { 
            this.isMSExist = false;
            if (this.simulatorConfig.serverSide) {
                this.simConfigService.setRunOnServer(this.simulatorConfig.serverSide);
            }
        }
        this.isMSCheckSpin = false;
    }

    async toggleRunOnServer() {
        if (!this.simulatorConfig.serverSide) {
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
                    this.simConfigService.setRunOnServer(this.simulatorConfig.serverSide);
                    this.checkIntervalValidation();
                } else {
                    this.simulatorConfig.serverSide = true;
                    this.simConfigService.setRunOnServer(true);
                }
            });
        } else {
            this.simConfigService.setRunOnServer(this.simulatorConfig.serverSide);
        }
    }

    private alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    checkIntervalValidation() {
        let serverSide;
        this.simConfigService.runOnServer$.subscribe((val) => {
            serverSide = val;
            if (!serverSide && this.simulatorConfig.config.interval < 30) {
                this.simulatorConfig.config.intervalInvalid = true;
            } else {
                this.simulatorConfig.config.intervalInvalid = false;
            }
        });
    }
}
