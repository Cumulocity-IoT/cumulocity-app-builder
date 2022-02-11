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

import { InjectionToken } from '@angular/core';
import { Observable, Subscription, from } from 'rxjs';
import { mergeAll, mergeMap, tap } from 'rxjs/operators';

export const HOOK_SIMULATION_STRATEGY_FACTORY = new InjectionToken('SimulationStrategy');

/**
 * An abstract simulator interface, all simulators should extend this
 */
export abstract class DeviceSimulator {

    private subs: Subscription[];

    started = false;

    start() {
        if (this.started) throw Error("Simulator already started");
        this.started = true;
        this.onStart();
    }
    stop() {
        if (!this.started) throw Error("Simulator already stopped");
        this.started = false;
        this.onStop();
        if (this.subs) {
            this.subs.forEach(s => s.unsubscribe());
        }

    }

    abstract onStart();
    abstract onStop();

    /**
     * this method will be called by the start to get
     * subscribe to an observable that channels the 
     * operations to the simulator
     */
    public subscribeToOperations(opSource$: Observable<any[]>): void {
        this.subs = []; //belt and braces
        this.subs.push(
            opSource$.pipe(
                mergeAll(),
            ).subscribe(v => {
                if (v.status != "FAILED" && v.status != "SUCCESSFUL") {
                    this.onOperation(v);
                }

            })
        );
    }

    /**
     * This method checks to see what the params are and the 
     * operation name - checks if interested and changes config 
     * if yes. default implementation, override in 
     * own class - shouldn't be called. 
     * 
     * @param param The parameters passed to the operation
     * @returns true if operation succeeds
     */
    public async onOperation(param: any): Promise<boolean> {
        return false;
    }

    isStarted() {
        return this.started;
    };

    onReset() { };
}
