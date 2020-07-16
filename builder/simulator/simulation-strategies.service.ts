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

import {Inject, Injectable} from "@angular/core";
import {HOOK_SIMULATION_STRATEGY_FACTORY} from "./device-simulator";
import {SimulationStrategyFactory} from "./simulation-strategy";

/**
 * A service containing a list of simulation strategies
 */
@Injectable({providedIn: 'root'})
export class SimulationStrategiesService {
    readonly strategies: SimulationStrategyFactory[];
    readonly strategiesByName: Map<string, SimulationStrategyFactory>;

    constructor(@Inject(HOOK_SIMULATION_STRATEGY_FACTORY) simulationStrategyFactories: SimulationStrategyFactory[]){
        this.strategies = simulationStrategyFactories;
        this.strategiesByName = new Map(simulationStrategyFactories.map(factory => [factory.getSimulatorMetadata().name, factory] as [string, SimulationStrategyFactory]))
    }
}
