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

import {Component} from "@angular/core";
import {
    ApplicationService,
    IApplication,
    PagingStrategy,
    RealtimeAction,
    UserService
} from "@c8y/client";
import {catchError, map} from "rxjs/operators";
import {from, Observable} from "rxjs";
import {AppStateService} from "@c8y/ngx-components";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {NewApplicationModalComponent} from "./new-application-modal.component";
import {Router} from "@angular/router";
import {contextPathFromURL} from "../utils/contextPathFromURL";

@Component({
    templateUrl: './app-list.component.html'
})
export class AppListComponent {
    applications: Observable<IApplication[]>;

    userHasAdminRights: boolean;

    bsModalRef: BsModalRef;

    constructor(private router: Router, private appService: ApplicationService, private appStateService: AppStateService, private modalService: BsModalService, private userService: UserService) {
        
        this.userHasAdminRights = userService.hasRole(appStateService.currentUser.value, "ROLE_APPLICATION_MANAGEMENT_ADMIN")
        
        // Get a list of the applications on the tenant (This includes live updates)
        if(this.userHasAdminRights){
            this.applications = from(this.appService.list$({ pageSize: 100, withTotalPages: true }, {
                hot: true,
                pagingStrategy: PagingStrategy.ALL,
                realtime: true,
                realtimeAction: RealtimeAction.FULL,
                pagingDelay: 0.1
            }))
                .pipe(
                    // Some users can't get the full list of applications (they don't have permission) so we get them by user instead (without live updates)
                    catchError(() =>
                        from(this.appService.listByUser(appStateService.currentUser.value, { pageSize: 2000 }).then(res => res.data))
                    ),
                    map(apps => apps.filter(app => app.hasOwnProperty('applicationBuilder'))),
                    map(apps => apps.sort((a, b) => a.id > b.id ? 1 : -1) )
                );
        } else {
            this.applications = from(this.appService.listByUser(appStateService.currentUser.value, { pageSize: 2000 }).then(res => res.data))
            .pipe(map(apps => apps.filter(app => app.hasOwnProperty('applicationBuilder'))),
            map(apps => apps.sort((a, b) => a.id > b.id ? 1 : -1) ) );
        }
    }

    createAppWizard() {
        this.bsModalRef = this.modalService.show(NewApplicationModalComponent, { class: 'c8y-wizard' ,initialState : 
        { applications: this.applications}});
    }

    async deleteApplication(id: number) {
        await this.appService.delete(id);

        // Refresh the applications list
        this.appStateService.currentUser.next(this.appStateService.currentUser.value);
    }

    openApp(app: IApplication & {applicationBuilder?: any}, subPath?: string) {
        if (app.contextPath && app.contextPath != contextPathFromURL()) {
            window.location = `/apps/${app.contextPath}/#/application/${app.id}${subPath || ''}` as any;
        } else {
            this.router.navigateByUrl(`/application/${app.id}${subPath || ''}`);
        }
    }
}
