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

import {RandomValueSimulationStrategyConfigComponent} from "./random-value.config.component";
import {SimulationStrategy} from "../../device-simulator/simulation-strategy.decorator";
import {DeviceIntervalSimulator} from "../../device-simulator/device-interval-simulator";

@SimulationStrategy({
    name: "Random Value",
    icon: "line-chart",
    description: "Simulates a line based on Random values",
    configComponent: RandomValueSimulationStrategyConfigComponent
})
export class RandomValueSimulationStrategy extends DeviceIntervalSimulator {
    protected interval = 1000;
    onTick() {
        let measurementValue = Math.floor(Math.random() * (this.config.maxValue - this.config.minValue + 1)) + this.config.minValue
        this.device.sendMeasurement(this.config, measurementValue);
    //    console.log('random value= '+ measurementValue);
    }
}