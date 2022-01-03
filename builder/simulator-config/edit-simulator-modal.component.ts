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
    ComponentFactory
} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {ApplicationService} from '@c8y/client';
import {AppIdService} from "../app-id.service";
import {SimulatorConfig} from "../simulator/simulator-config";
import {SimulationStrategiesService} from "../simulator/simulation-strategies.service";
import {SimulatorCommunicationService} from "../simulator/mainthread/simulator-communication.service";
import * as _ from 'lodash';

@Component({
    templateUrl: './edit-simulator-modal.component.html'
})
export class EditSimulatorModalComponent implements OnInit {
    busy: boolean = false;
    @ViewChild("configWrapper", { read: ViewContainerRef, static: true }) configWrapper: ViewContainerRef;
    simulatorConfig: SimulatorConfig;

    constructor(
        private simSvc: SimulatorCommunicationService,
        public bsModalRef: BsModalRef, private simulationStrategiesService: SimulationStrategiesService,
        private resolver: ComponentFactoryResolver, private injector: Injector,
        private appService: ApplicationService, private appIdService: AppIdService
    ) {}

    ngOnInit() {
        this.openSimulatorConfig();
    }

    openSimulatorConfig() {
        const strategyFactory = this.simulationStrategiesService.strategiesByName.get(this.simulatorConfig.type);
        if (strategyFactory == undefined) {
            console.error("Unknown simulator strategy:", this.simulatorConfig.type);
            this.bsModalRef.hide();
            return;
        }
        // For exisitng simulators
        if(this.simulatorConfig.config && !this.simulatorConfig.config.deviceName) {
            this.simulatorConfig.config.deviceName = this.simulatorConfig.config.deviceId;
        }
        
        const metadata = strategyFactory.getSimulatorMetadata();

        this.configWrapper.clear();
        
        if (metadata.configComponent != null) {
            const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(metadata.configComponent);
            const componentRef = this.configWrapper.createComponent(factory);
            componentRef.instance.config = this.simulatorConfig.config;

            //console.log("METADATA",metadata);
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
        }
        //console.log("openSimulatorConfig-end",this.simulatorConfig.config)
    }

    resetDialogSize() {
        this.bsModalRef.setClass('modal-sm');
    }
    async saveAndClose() {
        //console.log("saveAndClose",this.simulatorConfig)
        this.busy = true;
        let app = (await this.appService.detail(this.appIdService.getCurrentAppId())).data as any;

        let matchingIndex = app.applicationBuilder.simulators
            .findIndex(x => x.id == this.simulatorConfig.id);
        
        this.simulatorConfig.lastUpdated = new Date().toISOString();

        if (matchingIndex > -1) {
            app.applicationBuilder.simulators[matchingIndex] = this.simulatorConfig;
        } else {
            app.applicationBuilder.simulators.push(this.simulatorConfig)
        }


        await this.appService.update({
            id: app.id,
            applicationBuilder: app.applicationBuilder
        } as any);

        // We could just wait for them to refresh, but it's nicer to instantly refresh
        await this.simSvc.simulator.checkForSimulatorConfigChanges();

        this.bsModalRef.hide();
    }

    getSelectedDevice(device: any) {
        this.simulatorConfig.config.deviceId = device.id;
        this.simulatorConfig.config.deviceName = device.name;
    }
    cancelEdit() {
        this.bsModalRef.hide();
    }
}
