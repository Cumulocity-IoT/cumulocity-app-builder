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

import {Inject, Injectable, Type} from "@angular/core";
import {DeviceSimulator} from "./device-simulator";
import {DeviceHandle} from "./device-handle";
import {HOOK_SIMULATION_STRATEGY} from "../simulation-strategies/fixed-value/fixed-value.simulation-strategy.module";
import {SimulationStrategyMetadata} from "./simulation-strategy.decorator";
import {InventoryService} from "@c8y/client";
import {AppStateService} from "@c8y/ngx-components";
import {filter, first, mapTo} from "rxjs/operators";

export interface DeviceSimulatorStrategy {
    name: string,
    icon: string,
    description?: string,
    simulatorClass: Type<DeviceSimulator>
}

export interface DeviceSimulatorInstance extends DeviceSimulatorStrategy {
    id: number,
    instance: DeviceSimulator,
    deviceId: string
}

@Injectable({providedIn: 'root'})
export class DeviceSimulatorService {
    readonly strategiesByName: Map<string, DeviceSimulatorStrategy>;
    simulatorInstances: DeviceSimulatorInstance[] = [];

    constructor(@Inject(HOOK_SIMULATION_STRATEGY) simulationStrategies: Type<DeviceSimulator>[], private inventoryService: InventoryService, appStateService: AppStateService) {
        const strategies = simulationStrategies.map(simulatorClass => {
            const metadata: SimulationStrategyMetadata = Reflect.getMetadata('simulationStrategy', simulatorClass)[0];
            return {
                name: metadata.name,
                icon: metadata.icon,
                description: metadata.description,
                configComponent: metadata.configComponent,
                simulatorClass
            }
        });

        this.strategiesByName = new Map(strategies.map(strat => [strat.name, strat] as [string, DeviceSimulatorStrategy]));

        // Wait for the user to log in and then reload the simulators
        appStateService.currentUser
            .pipe(
                filter(user => user != null),
                first()
            )
            .toPromise()
            .then(() => this.reloadSimulators());
    }

    async reloadSimulators() {
        this.simulatorInstances.forEach(simInstance => {
            if (simInstance.instance.isStarted()) {
                simInstance.instance.stop();
            }
        });
        this.simulatorInstances = [];

        const simulatedDevices = (await this.inventoryService.list({ pageSize: 2000, query: 'has(simulators)' })).data;

        simulatedDevices.forEach(device => {
            device.simulators.forEach(simulatorConfig => {
                this.createInstance(simulatorConfig.id, simulatorConfig.type, simulatorConfig.name, device.id, simulatorConfig.config);
            });
        });
    }

    createInstance(id: number, strategyName: string, instanceName: string, deviceId: string, config: any): DeviceSimulator {
        const deviceHandle = new DeviceHandle();

        const strategy = this.strategiesByName.get(strategyName);
        if (!strategy) {
            throw new Error(`Could not find Simulator Strategy: ${strategyName}`);
        }

        const instance = new strategy.simulatorClass(instanceName, config, deviceHandle);

        this.simulatorInstances.push(Object.assign({}, strategy, {id, instance, deviceId}));
        return instance;
    }

    async deleteInstance(simulator: DeviceSimulatorInstance) {
        if (simulator.instance.isStarted()) {
            simulator.instance.stop();
        }
        this.simulatorInstances = this.simulatorInstances.filter(x => x.id !== simulator.id);

        const deviceSimulatorList = (await this.inventoryService.detail(simulator.deviceId)).data.simulators
            .filter(x => x.id !== simulator.id);

        await this.inventoryService.update({
            id: simulator.deviceId,
            simulators: deviceSimulatorList.length > 0 ? deviceSimulatorList : null
        });
    }
}