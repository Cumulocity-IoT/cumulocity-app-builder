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

export abstract class DeviceIntervalSimulator extends DeviceSimulator {
    protected abstract interval: number;

    private started = false;
    private intervalHandle;

    abstract onTick();

    onStart() {
        if (this.started) throw Error("Simulator already started");
        if (this.config.interval) {
            this.interval = this.config.interval;
        }
        console.log("Device Simulator started");
        this.device.updateSimulatorStatus(true);
        this.intervalHandle = setInterval(() => this.onTick(), this.interval);
        this.started = true;
    }

    onStop() {
        if (!this.started) throw Error("Simulator already stopped");
        clearInterval(this.intervalHandle);
        this.device.updateSimulatorStatus(false);
        console.log("Device Simulator stopped");
        this.started = false;
    }

    isStarted(): boolean {
        return this.started;
    }
}