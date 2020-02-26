/** IE10 and IE11 requires the following for the Reflect API. */
import 'core-js/es6/reflect';

/** Evergreen browsers require these. */
// Used for reflect-metadata in JIT. If you use AOT (and only Angular decorators), you can remove.
import 'reflect-metadata'
import 'core-js/es7/reflect';

/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import 'zone.js/dist/zone';  // Included with Angular CLI.



import {Client, BasicAuth, CookieAuth, AlarmService, ApplicationService, AuditService, FetchClient, DeviceRegistrationBulkService, DeviceRegistrationService, EventService, InventoryService, InventoryRoleService, InventoryBinaryService, MeasurementService, OperationService, UserRoleService, OperationBulkService, TenantSecurityOptionsService, SystemOptionsService, TenantOptionsService, Realtime, TenantService, UserService, UserGroupService} from "@c8y/client";
import { SimulationStrategiesModule } from "../simulation-strategies/simulation-strategies.module";
import {ApplicationRef, DoBootstrap, Inject, NgModule} from "@angular/core";
import {HOOK_SIMULATION_STRATEGY_FACTORY} from "./device-simulator";
import {SimulationStrategyFactory} from "./simulation-strategy";
import {platformWorkerAppDynamic} from "@angular/platform-webworker-dynamic";
import {BrowserModule} from "@angular/platform-browser";

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
        {provide: TenantService, useValue: client.tenant},
        {provide: UserService, useValue: client.user},
        {provide: UserGroupService, useValue: client.userGroup},
        {provide: UserRoleService, useValue: client.userRole}
    ]
})
export class AppModule implements DoBootstrap {
    constructor(@Inject(HOOK_SIMULATION_STRATEGY_FACTORY) simulationStrategyFactories: SimulationStrategyFactory[], fetchClient: FetchClient) {
        addEventListener('message', async ({data}) => {
            if (data.auth) {
                fetchClient.setAuth(new BasicAuth(data.auth));
            }
        });
    }

    ngDoBootstrap(appRef: ApplicationRef): void {}
}

platformWorkerAppDynamic().bootstrapModule(AppModule);
