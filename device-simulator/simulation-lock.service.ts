import { Injectable } from '@angular/core';
import { InventoryService } from '@c8y/ngx-components/api';
import {AppStateService} from "@c8y/ngx-components";
import * as delay from "delay";
import {BehaviorSubject, from, interval, NEVER, ReplaySubject} from "rxjs";
import {distinctUntilChanged, flatMap, map, startWith, switchMap} from "rxjs/operators";

const LOCK_TIMEOUT = 10000; // Milliseconds

interface LockStatus {
    sessionId: number,
    lockedBy: string,
    lockedOn: string
}

@Injectable({ providedIn: "root" })
export class SimulationLockService {
    sessionId: number = Math.floor(Math.random() * 1000000000);

    lockStatus$ = new ReplaySubject<{isLocked: boolean, isLockOwned: boolean, lockStatus: LockStatus}>(1);
    isLockOwned$ = new BehaviorSubject<boolean>(false);

    constructor(private inventoryService: InventoryService, private appStateService: AppStateService) {
        // Poll the lock status every half LOCK_TIMEOUT to work out what the current state of the lock is
        interval(LOCK_TIMEOUT/2)
            .pipe(
                startWith(0),
                map(() => Date.now()),
                flatMap(currentTime => {
                    return from(
                        this.getLockStatus()
                            .then(lockStatus => ({
                                isLocked: this._checkLock(currentTime, lockStatus),
                                lockStatus
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
                }))
            )
            .subscribe(this.lockStatus$);

        this.lockStatus$.pipe(map(({isLockOwned}) => isLockOwned)).subscribe(this.isLockOwned$);

        // Keep the lock alive automatically, if we own it
        this.isLockOwned$.pipe(
            switchMap(isLockOwned => {
                if (isLockOwned) {
                    return interval(LOCK_TIMEOUT/2);
                } else {
                    return NEVER;
                }
            })
        ).subscribe(() => {
            this.updateLockStatus({
                sessionId: this.sessionId,
                lockedBy: this.appStateService.currentUser.getValue().email,
                lockedOn: new Date().toUTCString()
            });
        });
    }

    async forceTakeLock(): Promise<void> {
        // Keep spamming the lock until we successfully take it
        while ((await this.getLockStatus()).sessionId != this.sessionId) {
            await this.updateLockStatus({
                sessionId: this.sessionId,
                lockedBy: this.appStateService.currentUser.getValue().email,
                lockedOn: new Date().toUTCString()
            });
            await delay(LOCK_TIMEOUT / 4);
            await this.updateLockStatus({
                sessionId: this.sessionId,
                lockedBy: this.appStateService.currentUser.getValue().email,
                lockedOn: new Date().toUTCString()
            });
            await delay(LOCK_TIMEOUT / 4);
        }

        // We succeeded in taking the lock
        // Refresh the lock timeout, we've wasted some time acquiring it
        await this.updateLockStatus({
            sessionId: this.sessionId,
            lockedBy: this.appStateService.currentUser.getValue().email,
            lockedOn: new Date().toUTCString()
        });
    }

    async takeLock(): Promise<boolean> {
        if (await this.isLocked()) {
            return false;
        }
        await this.updateLockStatus({
            sessionId: this.sessionId,
            lockedBy: this.appStateService.currentUser.getValue().email,
            lockedOn: new Date().toUTCString()
        });
        // wait half the lock timeout to see if we have managed to take the lock (There might be other people attempting to take it at the same time)
        await delay(LOCK_TIMEOUT/2);
        const currentLockStatus = await this.getLockStatus();
        if (currentLockStatus.sessionId === this.sessionId) {
            // We succeeded in taking the lock
            // Refresh the lock timeout, we've wasted some time acquiring it
            await this.updateLockStatus({
                sessionId: this.sessionId,
                lockedBy: this.appStateService.currentUser.getValue().email,
                lockedOn: new Date().toUTCString()
            });
            return true;
        } else {
            // We failed to take the lock
            return false;
        }
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

    async isLocked(): Promise<boolean> {
        const currentTime = Date.now();
        const lockStatus = await this.getLockStatus();
        return this._checkLock(currentTime, lockStatus);
    }

    async getLockStatus(): Promise<LockStatus | undefined> {
        const response = await this.inventoryService.list({query: 'has(AppBuilder_LockStatus)'});
        if (response.data.length > 0) {
            return response.data[0].AppBuilder_LockStatus;
        } else {
            return undefined;
        }
    }

    async updateLockStatus(lockStatus: LockStatus): Promise<void> {
        // TODO: possible optimisation - cache the lock managedObject Id so that we don't have to make an extra get request to find it
        const response = await this.inventoryService.list({query: 'has(AppBuilder_LockStatus)'});
        if (response.data.length > 0) {
            await this.inventoryService.update({
                id: response.data[0].id,
                AppBuilder_LockStatus: lockStatus
            });
        } else {
            await this.inventoryService.create({
                AppBuilder_LockStatus: lockStatus
            });
        }
    }
}