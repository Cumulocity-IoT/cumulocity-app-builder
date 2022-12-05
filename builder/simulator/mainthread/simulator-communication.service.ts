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
import {AppIdService} from "../../app-id.service";
import {filter} from "rxjs/operators";
import { ApplicationService, UserService, IUser } from "@c8y/client";
import {AlertService} from "@c8y/ngx-components";

/**
 * The service used for communicating with the simulators (running in a worker)
 */
@Injectable({providedIn: 'root'})
export class SimulatorCommunicationService {
    constructor(private appIdService: AppIdService, private applicationService: ApplicationService, 
        private alertService: AlertService, 
        private userService: UserService) {
        appIdService.appIdDelayedUntilAfterLogin$.pipe(filter(appId => appId != null)).subscribe((appId) => this.checkUserPermissions(appId));
    }

    private async checkUserPermissions(appId: string) {
        const result = await this.applicationService.detail(appId);
        const simulators = result.data?.applicationBuilder?.simulators;
        if(simulators && simulators.length > 0 ) {
            const isBrowserBasedSim = simulators.find( sim => sim.started && !sim?.serverSide );
            if(isBrowserBasedSim) {
                if (result.res.status === 401) {
                    this.alertService.danger("User does not have the required permissions to start simulators", "Missing Application Read Permission");
                } else if (result.res.status < 200 && result.res.status >= 300) {
                    this.alertService.danger("Unable to start simulators", await result.res.text());
                }
        
                const userWithRoles = ((await this.userService.currentWithEffectiveRoles()).data as any) as IUser;
                if (!this.userService.hasRole(userWithRoles, "ROLE_INVENTORY_ADMIN")) {
                    this.alertService.danger("User does not have the required permissions to start simulators", "Missing Inventory Admin Permission");
                }
            }
        }
    }
}
