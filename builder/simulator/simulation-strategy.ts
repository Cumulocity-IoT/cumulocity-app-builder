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

import {DeviceSimulator} from "./device-simulator";
import {SimulationStrategyMetadata} from "./simulation-strategy.decorator";
import { Type } from "@angular/core";
import { SimulatorConfig } from "./simulator-config";
import * as _ from 'lodash';

// Provided by the polyfills.ts - import '@angular-devkit/build-angular/src/angular-cli-files/models/jit-polyfills.js';
declare module Reflect {
    function getMetadata(name: string, target: any);
}

export abstract class SimulationStrategyConfigComponent {
    abstract config: any; //typed in extended
    abstract initializeConfig(): void; //extended knows how to init
    abstract getNamedConfig(label: string): any; //implemented in extended

    /**
     * hasOperations
     * 
     * @returns true if config supports operations
     */
    public hasOperations() : boolean {
        return (_.has(this,"config") && _.has(this.config,"operations"));
    }

    /**
     * add a set of parameters to the simulator for this label.
     * 
     * @param label entry into operations map
     * @param config actual configuration for this label
     * @returns true if the entry was added
     */
    public addOperation(label: string, config: any ) : boolean {
        if( this.hasOperations() ) {
            let ops = _.get(this.config,"operations");
            ops[label]=config;
            return true;
        }
        return false;
    }

    /**
     * remove a named entry from the simulator.
     * 
     * @param label the specific configuration to remove
     * @returns true if the entry was removed. 
     */
    public removeOperation(label: string) : boolean {
        if( this.hasOperations() ) {
            let ops: Map<string,any> = _.get(this.config,"operations");
            ops.delete(label);
        } 
        return false;
    }

    /**
     * clear the operations entires
     * @returns true if cleared. 
     */
    public removeAllOperations() : boolean {
        if( this.hasOperations() ) {
            let ops: Map<string,any> = _.get(this.config,"operations");
            ops.clear();
            return true;
        } 
        return false;
    }

    /**
     * return an any or undefined when a label is queried.
     * 
     * This is a helper function for the extended class 
     * to use in getNamedConfig so it can cast the return 
     * to a specified interface for use. 
     * 
     * @param label is the entry required
     * @returns 
     */
    public getConfigAsAny(label: string): any | undefined {
        if( this.hasOperations() ) {
            let ops: Map<string,any> = _.get(this.config,"operations");
            if(ops.has(label)) {
                return ops[label];
            }
        } 
        return undefined;
    }
}

export abstract class SimulationStrategyFactory<T extends DeviceSimulator = DeviceSimulator> {
    abstract createInstance(config: SimulatorConfig): T;

    abstract getSimulatorClass(): Type<T>;

    getSimulatorMetadata(): SimulationStrategyMetadata {
        return Reflect.getMetadata('simulationStrategy', this.getSimulatorClass())[0] as SimulationStrategyMetadata;
    }
}
