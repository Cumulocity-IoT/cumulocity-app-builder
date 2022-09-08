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
 *  Operation Definition. 
 * 
 *  if the members exist we can use the configurations, if not use prior mechanism.
 *  The default config will be the config object and duplicated in this map.
 */

export interface OperationSupport<T> {
    opEnabled?: boolean, //device id
    opSource?: string, //device id
    opSourceName?: string,
    payloadFragment?: string,
    opReply?: boolean,
    configIndex: number;
    operations?: Array<T>;
}


/**
 *  DtdlSimulationModel is the base interface for all configs now
 *  it should be extended to add new simulator config types. It 
 *  simplifies the structure slightly as we have 1 point of reference
 *  and means we can handle the configs slightly more consistantly
 */
export interface DtdlSimulationModel {
    modalSize?: string,
    deviceName?: string,
    dtdlDeviceId?: string,
    dtdlModelConfig?: DtdlSimulationModel[],
    isEditMode?: boolean,
    matchingValue: string,
    measurementName?: string,
    fragment?: string,
    series?: any,
    unit?: any,
    schema?: any,
    id?: string,
    minValue?: number, // random value, random walk
    maxValue?: number, // random value, random walk
    value?: any, // value series
    startingValue?: number, // random walk
    maxDelta?: number, // random walk
    latitude?: string, // position update
    longitude?: string, // position update
    altitude?: string, // position update
    deviceId?: string;
    simulationType?: string;
    isObjectType?: boolean;
    parentId?: string;
    isFieldModel?: boolean;
    eventType?: string; // event creation
    eventText?: string; // event creation
    interval?: number;
    waveType?: 'sine' | 'sqr' | 'sqr-approx',
    height?: number,
    wavelength?: number,
    firmwareVersions?: {
        name: string,
        version: string,
        url: string;
    }[],
    resetOn?: 'restart' | 'never';
    isGroup?: boolean,
    alternateConfigs?: OperationSupport<DtdlSimulationModel>;

    // file Simulator config
    headerPresent?: boolean;
    fileId?: string;
    generationType?: string;
    type?: string;
    loop?: boolean;
    loopDelay?: number;
    intervalType?: string;
    stepValue?: string;
    dateTime?: string;
    fileColumns?: any;
    typeColumns?: any;
    fragmentColumns?: any;
    csvJsonFile?: any;
    eventTypeColumns?: any;
    serverSide?: any;
    intervalInvalid?: any;
}

/**
 *  The interface that for simulator configuration that all simulators will be passed.
 *  N.B. The strategy stores only the config member (See Factory classes)
 */
export interface SimulatorConfig {
    id: number,
    name: string,
    type: string,
    config: DtdlSimulationModel,
    started?: boolean,
    metadata?: SimulationStrategyMetadata,
    lastUpdated?: string,
    serverSide?: boolean
}


