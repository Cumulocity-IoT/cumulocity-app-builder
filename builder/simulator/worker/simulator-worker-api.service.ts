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

import {Injectable} from "@angular/core";
import { BasicAuth, FetchClient, IUser, ICurrentTenant, ICredentials, IFetchOptions} from "@c8y/client";
import {LockStatus, SimulationLockService} from "./simulation-lock.service";
import {AppStateService} from "@c8y/ngx-components";
import {AppIdService} from "../../app-id.service";
import { SimulatorConfig } from "../simulator-config";
import {BehaviorSubject, interval, merge, Subject, Subscription} from "rxjs";
import { of } from "rxjs";
import { debounceTime, map, switchMap, tap } from "rxjs/operators";
import { OperationService } from "@c8y/ngx-components/api";
/**
 * The public api for talking to the simulators
 * Fields starting with _ are for use only by the worker
 */
@Injectable()
export class SimulatorWorkerAPI {
    private _listenerId;
    _incomingOperations = new BehaviorSubject<any[]> ( [] );
    _incomingOperationsSub : Subscription = undefined;
    _lockStatus$ = new BehaviorSubject<{isLocked: boolean, isLockOwned: boolean, lockStatus?: LockStatus}>({isLocked: false, isLockOwned: false});
    _simulatorConfig$ = new BehaviorSubject<Map<number, SimulatorConfig>>(new Map());
    _listeners = new Map<number, Subscription>();
    _checkForSimulatorConfigChanges = new Subject<any>();

    constructor(
        private fetchClient: FetchClient,
        private lockService: SimulationLockService,
        private appStateService: AppStateService,
        private appIdService: AppIdService
    ) {}

    setUserAndCredentials(user: IUser | null, credentials: ICredentials, isCookieAuth: boolean, cookieAuth: any) {
        if(isCookieAuth) {
            this.fetchClient.defaultHeaders = {'X-XSRF-TOKEN': cookieAuth};
        }
        this.fetchClient.setAuth(new BasicAuth(credentials));
        this.startRealtime();
        this.appStateService.currentUser.next(user);
    }

    async startRealtime() {
        //handle change here
        if( this._incomingOperationsSub !== undefined) {
            this._incomingOperationsSub.unsubscribe()
        }

        this._incomingOperationsSub = merge(
            of(-1), // Check the current value immediately
            interval(5000), // Check every 30 seconds
        ).pipe(
            debounceTime(100),
            switchMap(() => 
                this.fetchClient.fetch('/devicecontrol/operations')
            ),
            switchMap(res => res.json()),
            map( data => data.operations ),
//            tap( data => console.log("BEFORE", data)),
            map( (data: any[]) => data.filter( element => element.status == "PENDING" ))
        ).subscribe( ops => this._incomingOperations.next(ops));
    }

    setTenant(tenant: ICurrentTenant | null) {
        this.appStateService.currentTenant.next(tenant);
    }

    setAppId(appId: string) {
        this.appIdService.appId$.next(appId);
    }

    async forceTakeLock() {
        await this.lockService.forceTakeLock(this.appIdService.getCurrentAppId());
    }

    addLockStatusListener(listener: (lockStatus: {isLocked: boolean, isLockOwned: boolean, lockStatus?: LockStatus}) => void): number {
        const id = this._listenerId++;
        this._listeners.set(id, this._lockStatus$.subscribe(lockStatus => listener(lockStatus)));
        return id;
    }

    removeListener(id: number) {
        this._listeners.delete(id);
    }

    addSimulatorConfigListener(listener: (simulatorConfig: Map<number, SimulatorConfig>) => void): number {
        const id = this._listenerId++;
        this._listeners.set(id, this._simulatorConfig$.subscribe(simulatorConfig => listener(simulatorConfig)));
        return id;
    }

    checkForSimulatorConfigChanges() {
        this._checkForSimulatorConfigChanges.next();
    }

    async unlock() {
        return this.lockService.unlock(this.appIdService.getCurrentAppId());
    }
}
