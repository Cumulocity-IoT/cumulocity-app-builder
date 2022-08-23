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
import { InventoryService } from '@c8y/ngx-components/api';
import {AppStateService} from "@c8y/ngx-components";
import * as delay from "delay";
import { from, interval, Observable } from "rxjs";
import {
    distinctUntilChanged,
    flatMap,
    map, shareReplay,
    startWith,
} from "rxjs/operators";
import {Injectable} from "@angular/core";

export const LOCK_TIMEOUT = 10000; // Milliseconds

export interface LockStatus {
    sessionId: number,
    lockedBy: string,
    lockedOn: string
}

/**
 * Manages the simulator lock and it's status
 * The lock is unique per application and consists of a managedObject with the following format:
 * {
 *     id: '123', // The managedObject id
 *     applicationId: '456', // The id of the appBuilder application
 *     AppBuilder_LockStatus: {
 *         sessionId: 789,
 *         lockedBy: 'richard.peach@email.com',
 *         lockedOn: 'Thu, 16 Jul 2020 14:57:02 GMT'
 *     }
 * }
 */
@Injectable({providedIn: 'root'})
export class SimulationLockService {
    sessionId: number = Math.floor(Math.random() * 1000000000);

    lockManagedObjectIdCache = new Map<string, string>();
    lockStatusObservableCache = new Map<string, Observable<{isLocked: boolean, isLockOwned: boolean, lockStatus: LockStatus}>>();

    constructor(private inventoryService: InventoryService, private appStateService: AppStateService) {}

    lockStatus$(appId: string): Observable<{isLocked: boolean, isLockOwned: boolean, lockStatus: LockStatus}> {
        if (this.lockStatusObservableCache.has(appId)) {
            return this.lockStatusObservableCache.get(appId);
        }
        // Poll the lock status every half LOCK_TIMEOUT to work out what the current state of the lock is
        const lockStatus$ = interval(LOCK_TIMEOUT/2)
            .pipe(
                startWith(0),
                map(() => Date.now()),
                flatMap(currentTime => {
                    return from(
                        this.getLockStatus(appId)
                            .catch(() => this.getLockStatus(appId)) // If we get a failure, then retry once
                            .then(lockStatus => ({
                                isLocked: this._checkLock(currentTime, lockStatus),
                                lockStatus
                            }))
                            .catch(() => ({ // Multiple failures to get lock status. We'll act like the lock is taken by someone else
                                isLocked: true,
                                lockStatus: undefined
                            }))
                    );
                }),
                distinctUntilChanged((prev, curr) => {
                    if (prev.isLocked !== curr.isLocked) {
                        return false;
                    }
                    if (prev.lockStatus == undefined || curr.lockStatus == undefined) {
                        return prev.lockStatus == undefined && curr.lockStatus == undefined;
                    } else {
                        return prev.lockStatus.sessionId === curr.lockStatus.sessionId;
                    }
                }),
                map(({isLocked, lockStatus}) => ({
                    isLocked,
                    lockStatus,
                    isLockOwned: lockStatus != undefined && lockStatus.sessionId === this.sessionId
                })),
                shareReplay({
                    bufferSize: 1,
                    refCount: true
                } as any)
            );
        this.lockStatusObservableCache.set(appId, lockStatus$);
        return lockStatus$;
    }

    async forceTakeLock(appId: string): Promise<void> {
        // Keep spamming the lock until we successfully take it
        while ((await this.getLockStatus(appId)).sessionId != this.sessionId) {
            await this.refreshLock(appId);
            await delay(LOCK_TIMEOUT / 4);
            await this.refreshLock(appId);
            await delay(LOCK_TIMEOUT / 4);
        }

        // We succeeded in taking the lock
        // Refresh the lock timeout, we've wasted some time acquiring it
        await this.refreshLock(appId);
    }

    async takeLock(appId: string): Promise<boolean> {
        if (await this.isLocked(appId)) {
            return false;
        }
        await this.refreshLock(appId);
        // wait half the lock timeout to see if we have managed to take the lock (There might be other people attempting to take it at the same time)
        await delay(LOCK_TIMEOUT/2);
        const currentLockStatus = await this.getLockStatus(appId);
        if (currentLockStatus.sessionId === this.sessionId) {
            // We succeeded in taking the lock
            // Refresh the lock timeout, we've wasted some time acquiring it
            await this.refreshLock(appId);
            return true;
        } else {
            // We failed to take the lock
            return false;
        }
    }

    /**
     * Unlocks the simulators for the appId specified.
     * Note: doesn't check to see if the lock is owned by the person unlocking
     * @param appId
     */
    async unlock(appId: string): Promise<void> {
        await this.updateLockStatus(appId, {
            sessionId: -1,
            lockedBy: '',
            lockedOn: new Date(0).toUTCString()
        });
    }

    _checkLock(currentTime: number, lockStatus: LockStatus | undefined): boolean {
        if (lockStatus) {
            const lockTime = Date.parse(lockStatus.lockedOn);
            // Lock can be held for a maximum of LOCK_TIMEOUT milliseconds
            return currentTime - lockTime <= LOCK_TIMEOUT;
        } else {
            return false;
        }
    }

    async isLocked(appId: string): Promise<boolean> {
        const currentTime = Date.now();
        const lockStatus = await this.getLockStatus(appId);
        return this._checkLock(currentTime, lockStatus);
    }

    async getLockStatus(appId: string): Promise<LockStatus | undefined> {
        const response = await this.inventoryService.list({query: `has(AppBuilder_LockStatus) and applicationId eq '${appId}'`});
        if (response.data.length > 0) {
            const lockObject = response.data[0];
            this.lockManagedObjectIdCache.set(appId, lockObject.id);
            return lockObject.AppBuilder_LockStatus;
        } else {
            return undefined;
        }
    }

    async updateLockStatus(appId: string, lockStatus: LockStatus): Promise<void> {
        if (!this.lockManagedObjectIdCache.has(appId)) {
            // Calling getLockStatus will update the lockManagedObjectIdCache allowing us to get the id (if it exists)
            await this.getLockStatus(appId);
        }
        if (this.lockManagedObjectIdCache.has(appId)) {
            await this.inventoryService.update({
                id: this.lockManagedObjectIdCache.get(appId),
                applicationId: appId,
                AppBuilder_LockStatus: lockStatus
            });
        } else {
            await this.inventoryService.create({
                applicationId: appId,
                AppBuilder_LockStatus: lockStatus
            });
        }
    }

    async refreshLock(appId: string): Promise<void> {
        return this.updateLockStatus(appId, {
            sessionId: this.sessionId,
            lockedBy: (this.appStateService.currentUser.getValue().email ? this.appStateService.currentUser.getValue().email :this.appStateService.currentUser.getValue().userName),
            lockedOn: new Date().toUTCString()
        });
    }
}
