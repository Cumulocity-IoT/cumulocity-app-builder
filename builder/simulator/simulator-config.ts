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

import { SimulationStrategyMetadata } from "./simulation-strategy.decorator";

/**
 *  OperationDefinitions<T> contains instances of config attached to a 
 *  label. Remember the default config lies on the config object as fields
 *  instances of this are additional to the "default"
 */
export interface OperationDefinitions<T> {
    matchingValue: string,
    config: T;
}


/**
 *  Operation Definition. 
 * 
 *  The derived config interfaces now need to extend OperationSupport.
 *  if the member exists we can use the configurations, if not use existing mechanism.
 *  The default config will be the config object and duplicated in this map.
 */

export interface OperationSupport<T> {
    opSource?: string, //device id
    opSourceName?: string,
    payloadFragment?: string,
    opReply?: boolean,
    operations?: Array<OperationDefinitions<T>>;
}


/**
 *  The interface that for simulator configuration that all simulators will be passed.
 *  N.B. The strategy stores only the config member (See Factory classes)
 */
export interface SimulatorConfig<T = any> {
    id: number,
    name: string,
    type: string,
    config: T,
    started?: boolean,
    metadata?: SimulationStrategyMetadata;
}
