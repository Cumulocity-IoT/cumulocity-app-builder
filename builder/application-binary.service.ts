/*
* Copyright (c) 2023 Software AG, Darmstadt, Germany and/or its licensors
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
import { ApplicationService, ApplicationType, IApplication, IResultList, IUploadParamsOverride, TenantService } from "@c8y/client";
import { AppStateService, ModalService, Status, ZipService, gettext } from "@c8y/ngx-components";
import { BehaviorSubject, Observable } from 'rxjs';
import { kebabCase } from 'lodash-es';
import { SettingsService } from "./settings/settings.service";
import { DependencyDescription } from "./template-catalog/template-catalog.model";


@Injectable({ providedIn: 'root' })
export class ApplicationBinaryService {

    private xhr: XMLHttpRequest;
    progress: BehaviorSubject<number> = new BehaviorSubject<number>(null);

    constructor(
        private modal: ModalService,
        private appStateService: AppStateService,
        private applicationService: ApplicationService,
        private zipService: ZipService,
        private tenantService: TenantService,
        private settingService: SettingsService
    ) { }

    async createAppForMicroservice(binary, dependencies: DependencyDescription): Promise<IApplication> {
        let appModel: any = {};
        appModel = await this.getCumulocityJson(binary).toPromise();

        const key =  `${kebabCase(dependencies.id)}-key`
        const contextPath = appModel?.contextPath || dependencies?.id.toLowerCase();

        const appObj = {
            resourcesUrl: '/',
            type: ApplicationType.MICROSERVICE,
            name: dependencies.id,
            key,
            contextPath
        };

        return (await this.applicationService.create({...appObj})).data;
    }
    
    private getCumulocityJson(archive: File): Observable<any> {
        return this.zipService.getJsonData(archive, {
          filename: 'cumulocity.json'
        });
      }

    async uploadMicroservice(file: File, microservice: IApplication): Promise<void> {
        const subscribeToCurrentTenant = await this.requestForSubscription();
        const microserviceApp: IApplication = await this.uploadBinary(file, microservice);
        if(microserviceApp) {
            if(window && window['aptrinsic'] ){
                window['aptrinsic']('track', 'gp_microservice_installed', {
                    "microserviceName": microserviceApp.name,
                    "tenantId": this.settingService.getTenantName()
                 });
            }
        }

        await this.subscribeMicroservice(microservice, subscribeToCurrentTenant);
    }

    private async requestForSubscription(): Promise<boolean> {
        try {
            await this.modal.confirm(
                gettext('Subscribe to microservice'),
                gettext(
                    'You are about to subscribe to the microservice after upload. Do you want to subscribe to it?'
                ),
                Status.INFO,
                { ok: gettext('Subscribe'), cancel: gettext("Don't subscribe") }
            );
            return true;
        } catch (ex) {
            return false;
        }
    }

    private async subscribeMicroservice(
        app: IApplication,
        subscribeToCurrentTenant: boolean
    ): Promise<any> {
        const tenant = (await this.tenantService.current()).data;
        const applications = tenant.applications.references;

        const isSubscribed = applications.some(({ application }) => application.id === app.id);
        if (!isSubscribed && subscribeToCurrentTenant) {
            try {
                return await this.tenantService.subscribeApplication(tenant, app);
            } catch (res) {
                if (res.status === 409) {
                    throw Error("ALREADY_SUBSCRIBED");
                }
            }
        } else if (isSubscribed && !subscribeToCurrentTenant) {
            return this.tenantService.unsubscribeApplication(tenant, app);
        }
    }

    async uploadBinary( file: File, app: IApplication ): Promise<IApplication> {
        const appBinary = (await this.applicationService.binary(app).upload(file)).data;
        return (await this.setActiveVersion(app, appBinary.id as string)).data;
    }

    setActiveVersion(app: IApplication, activeVersionId: string): Promise<IApplication> {
        return this.applicationService.update({ id: app.id, activeVersionId });
    }

    getApplications(customFilter: any = {}): Promise<IResultList<IApplication>> {
        const filter: object = {
          pageSize: 2000,
          withTotalPages: true
        };
        Object.assign(filter, customFilter);
        const currentTenant = this.appStateService.currentTenant.value;
        return this.applicationService.listByTenant(currentTenant.name, filter);
    }

    async verifyExistingMicroservices(name: string) {
        const apps = (await this.getApplications()).data;
        const ms = apps.filter(app => this.isMicroservice(app) && app.name === name);
        return (ms && ms.length > 0 ? true: false);
    }

    isMicroservice(app: IApplication): boolean {
        return app.type === 'MICROSERVICE';
    }

    isMicroserviceEnabled(appList: IApplication[]) {
        const featureMSHosting = appList.find( app => app.contextPath == 'feature-microservice-hosting');
        if(featureMSHosting) { return true;}
        return false;
            
    }
}

