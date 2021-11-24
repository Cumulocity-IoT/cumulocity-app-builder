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
    PositionUpdateSimulationStrategyConfigComponent
} from "./position-update.config.component";
import {SimulationStrategy} from "../../builder/simulator/simulation-strategy.decorator";
import {DeviceIntervalSimulator} from "../../builder/simulator/device-interval-simulator";
import {Injectable, Injector, isDevMode} from "@angular/core";
import {SimulationStrategyFactory} from "../../builder/simulator/simulation-strategy";
import {MeasurementService, EventService, InventoryService, IManagedObject} from "@c8y/client";
import {DtdlSimulationModel, SimulatorConfig} from "../../builder/simulator/simulator-config";

export interface C8yPosition {
    lng: any; // in case the coordinates are defined as string...
    alt: any;
    lat: any;
}

@SimulationStrategy({
    name: "Position Update",
    icon: "map-marker",
    description: "Simulates a Device Position Update",
    configComponent: PositionUpdateSimulationStrategyConfigComponent
})
export class PositionUpdateSimulationStrategy extends DeviceIntervalSimulator {
    latitude = [];
    longitude = [];
    altitude = [];
    measurementCounter = 0;
    private invService: InventoryService;
    constructor(protected injector: Injector, private eventService: EventService, 
         private config: DtdlSimulationModel) {
        super(injector);
        this.invService = injector.get(InventoryService);
    }

    protected get interval() {
        return this.config.interval * 1000;
    }

    get strategyConfig() {
        return this.config;
    } 
    
    private updatePosition(deviceId: string, position: C8yPosition){
        const deviceToUpdate: Partial<IManagedObject> = {
            id: deviceId,
            c8y_Position: position
        };
        this.invService.update(deviceToUpdate);
    }
    onStart() {
        this.latitude = this.config.latitude.split(',').map(value => parseFloat(value.trim()));
        this.longitude = this.config.longitude.split(',').map(value => parseFloat(value.trim()));
        this.altitude = this.config.altitude.split(',').map(value => parseFloat(value.trim()));
        super.onStart();
    }

    onTick(groupDeviceId?: any) {
        const time = new Date().toISOString();
        const deviceId = (groupDeviceId? groupDeviceId : this.config.deviceId);
        if (this.measurementCounter >= this.latitude.length || this.measurementCounter >= this.longitude.length) {
            this.measurementCounter = 0;
        }
        const position: C8yPosition = {
            lat: this.latitude[this.measurementCounter],
            alt: this.altitude[this.measurementCounter],
            lng: this.longitude[this.measurementCounter] 
        };
        this.updatePosition(deviceId, position);

        this.eventService.create({
            source: {
                id: deviceId
            },
            type: "c8y_LocationUpdate",
            time: time,
            text: "LocationUpdate",
            c8y_Position: {
                lng: this.longitude[this.measurementCounter],
                alt: this.altitude[this.measurementCounter],
                lat: this.latitude[this.measurementCounter++], 
                }
        });        
    }
}

@Injectable()
export class PositionUpdateSimulationStrategyFactory extends SimulationStrategyFactory<PositionUpdateSimulationStrategy> {
    constructor(private injector: Injector, private eventService: EventService) {
        super();
    }

    createInstance(config: SimulatorConfig): PositionUpdateSimulationStrategy {
        return new PositionUpdateSimulationStrategy(this.injector, this.eventService, config.config);
    }

    getSimulatorClass(): typeof PositionUpdateSimulationStrategy {
        return PositionUpdateSimulationStrategy;
    }
}
