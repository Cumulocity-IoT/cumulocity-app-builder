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

import {Client, CookieAuth, AlarmService, ApplicationService, AuditService, FetchClient, DeviceRegistrationBulkService, DeviceRegistrationService, EventService, InventoryService, InventoryRoleService, InventoryBinaryService, MeasurementService, OperationService, UserRoleService, OperationBulkService, TenantSecurityOptionsService, SystemOptionsService, TenantOptionsService, Realtime, TenantService, UserService, UserGroupService, IdentityService} from "@c8y/client";
import { SimulationStrategiesModule } from "../../../simulation-strategies/simulation-strategies.module";
import {ApplicationRef, DoBootstrap, NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {SimulatorWorkerAPI} from "./simulator-worker-api.service";
import * as Comlink from 'comlink';
import {SimulationLockService} from "./simulation-lock.service";
import {AppStateService} from "@c8y/ngx-components";
import {AppIdService} from "../../app-id.service";
import {WorkerAppIdService} from "./worker-app-id.service";
import {WorkerAppStateService} from "./worker-app-state.service";
import {SimulatorManagerService} from "./simulator-manager.service";
import {SimulationStrategiesService} from "../simulation-strategies.service";

const client = new Client(new CookieAuth());

@NgModule({
    imports: [
        BrowserModule,
        SimulationStrategiesModule
    ],
    providers: [
        {provide: AlarmService, useValue: client.alarm},
        {provide: ApplicationService, useValue: client.application},
        {provide: AuditService, useValue: client.audit},
        {provide: FetchClient, useValue: client.core},
        {provide: DeviceRegistrationService, useValue: client.deviceRegistration},
        {provide: DeviceRegistrationBulkService, useValue: client.deviceRegistrationBulk},
        {provide: EventService, useValue: client.event},
        {provide: InventoryService, useValue: client.inventory},
        {provide: InventoryRoleService, useValue: client.inventoryRole},
        {provide: InventoryBinaryService, useValue: client.inventoryBinary},
        {provide: MeasurementService, useValue: client.measurement},
        {provide: OperationService, useValue: client.operation},
        {provide: OperationBulkService, useValue: client.operationBulk},
        {provide: TenantSecurityOptionsService, useValue: client.options.security},
        {provide: SystemOptionsService, useValue: client.options.system},
        {provide: TenantOptionsService, useValue: client.options.tenant},
        {provide: Realtime, useValue: client.realtime},
        {provide: InventoryRoleService, useValue: client.role},
        {provide: TenantService, useValue: client.tenant},
        {provide: UserService, useValue: client.user},
        {provide: UserGroupService, useValue: client.userGroup},
        {provide: UserRoleService, useValue: client.userRole},
        {provide: IdentityService, useValue: client.identity},

        {provide: AppStateService, useClass: WorkerAppStateService},
        {provide: AppIdService, useClass: WorkerAppIdService},

        SimulatorWorkerAPI,
        SimulationLockService,
        SimulationStrategiesService,
        SimulatorManagerService
    ]
})
export class SimulatorWorkerModule implements DoBootstrap {
    constructor(simulatorAPI: SimulatorWorkerAPI, simulatorManager: SimulatorManagerService) {
        // Expose the api of the worker to the main thread
        Comlink.expose(simulatorAPI);

        // Start the simulator manager so that the simulators are loaded, created, and started
        simulatorManager.initialize();
    }

    ngDoBootstrap(appRef: ApplicationRef): void {}
}
