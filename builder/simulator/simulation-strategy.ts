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
import { DtdlSimulationModel, SimulatorConfig } from "./simulator-config";
import * as _ from 'lodash';

// Provided by the polyfills.ts - import '@angular-devkit/build-angular/src/angular-cli-files/models/jit-polyfills.js';
declare module Reflect {
    function getMetadata(name: string, target: any);
}

export abstract class SimulationStrategyConfigComponent {
    abstract config: any; //typed in extended
    abstract initializeConfig(existingConfig?: any): void

    public checkAlternateConfigs(target: DtdlSimulationModel) {
        if (!this.hasOperations(target)) {
            target.alternateConfigs = {
                opSource: "",
                opSourceName: "",
                payloadFragment: "c8y_Command.text",
                opReply: false,
                operations: [],
                configIndex: 0
            };
        }
    }

    public deleteOperation(index:number) : void {
        if( this.hasOperations(this.config) ) {
            let ops: Array<any> = _.get(this.config.alternateConfigs,"operations");
            ops.splice(index,1);
        }
    }

    /**
     * hasOperations
     * 
     * @returns true if config supports operations
     */
    public hasOperations(target: DtdlSimulationModel) : boolean {
        return ( _.has(target,"alternateConfigs") && _.has(target.alternateConfigs,"operations"));
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
    public getConfigAsAny(index: number): any | undefined {
        if( this.hasOperations(this.config) ) {
            let ops: Array<any> = _.get(this.config.alternateConfigs,"operations");
            if(ops.length >= (index+1)) { //zero based
                return ops[index].config;
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
