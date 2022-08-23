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

import { Injectable } from "@angular/core";
import { AppStateService } from "@c8y/ngx-components";
import { UserGroupService, UserService } from "@c8y/ngx-components/api";
import { from, of } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import { AppIdService } from "./app-id.service";

@Injectable({providedIn: 'root'})
export class AccessRightsService {
    private allGlobalRoles: any = [];
    private loggedInUserRoles: any = [];
    private userHasAdminRights: boolean;
    constructor(appIdService: AppIdService, private userGroupService: UserGroupService, 
        private userService: UserService, private appStateService: AppStateService) {
        appIdService.appIdDelayedUntilAfterLogin$.pipe(tap(() => {
                this.getLoggedInUserRoles();
                this.userHasAdminRights = userService.hasRole(appStateService.currentUser.value, "ROLE_APPLICATION_MANAGEMENT_ADMIN")
        }))
        .subscribe(async app => {
               // TODO
        });
    }

    private getLoggedInUserRoles() {
        if(this.appStateService.currentUser && this.appStateService.currentUser.value) {
            const user: any = this.appStateService.currentUser.value;
           this.loggedInUserRoles = user.groups?.references;
        }
    }

    private async getGlobalRoles() {
        const userGroupFilter = {
            pageSize: 1000,
            withTotalPages: true
        };
        const {data, res, paging} = await this.userGroupService.list(userGroupFilter)
        this.allGlobalRoles = data.map(({ id, name }) => ({ id, name }));;
        if(this.allGlobalRoles && this.allGlobalRoles.length > 0) {
            this.allGlobalRoles = this.allGlobalRoles.sort((a, b) => a.name?.toLowerCase() > b.name?.toLowerCase() ? 1 : -1);
        }
    }

    async getAllGlobalRoles() {
        if(this.allGlobalRoles && this.allGlobalRoles.length > 0) { return this.allGlobalRoles;}
        else {
            await this.getGlobalRoles();
            return this.allGlobalRoles;
        }
    }

    userHasAccess(dashboardRoles: any) {
        if(this.userHasAdminRights) { return true;}

        if(dashboardRoles && dashboardRoles.length > 0) {
            for(let role of dashboardRoles) {
                const hasRole = this.loggedInUserRoles.find( userRole => userRole.group && userRole.group.id === role.id);
                if(hasRole) { return true;}
            };
            return false;
        }
        return true;
    }
}