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

import {SimulationStrategy} from "../../builder/simulator/simulation-strategy.decorator";
import {DeviceIntervalSimulator} from "../../builder/simulator/device-interval-simulator";
import {Injectable, Injector, isDevMode} from "@angular/core";
import {SimulationStrategyFactory} from "../../builder/simulator/simulation-strategy";
import {MeasurementService, EventService, InventoryService, IManagedObject} from "@c8y/client";
import {DtdlSimulationModel, SimulatorConfig} from "../../builder/simulator/simulator-config";
import { FileValuesSimulationStrategyConfigComponent } from "./file-values.config.component";

export interface C8yPosition {
    lng: any; // in case the coordinates are defined as string...
    alt: any;
    lat: any;
}

@SimulationStrategy({
    name: "File (CSV/JSON)",
    icon: "document",
    description: "Simulate device based on data provided in file",
    hideSimulatorName: true, // hide default simulator name field
    configComponent: FileValuesSimulationStrategyConfigComponent
})
export class FileValuesSimulationStrategy extends DeviceIntervalSimulator {
    constructor(protected injector: Injector, private eventService: EventService, 
         private config: DtdlSimulationModel) {
        super(injector);
    }

    protected get interval() {
        return this.config.interval * 1000;
    }

    get strategyConfig() {
        return this.config;
    } 
    
    
    onStart() {
        super.onStart();
    }

    onTick(groupDeviceId?: any) {
        // This is server side simulator
    }
}

@Injectable()
export class FileValuesSimulationStrategyFactory extends SimulationStrategyFactory<FileValuesSimulationStrategy> {
    constructor(private injector: Injector, private eventService: EventService) {
        super();
    }

    createInstance(config: SimulatorConfig): FileValuesSimulationStrategy {
        return new FileValuesSimulationStrategy(this.injector, this.eventService, config.config);
    }

    getSimulatorClass(): typeof FileValuesSimulationStrategy {
        return FileValuesSimulationStrategy;
    }
}
