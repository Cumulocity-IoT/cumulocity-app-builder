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
import { ApplicationService, ApplicationType, IApplication, IManifest, IResultList, IUploadParamsOverride, TenantService } from "@c8y/client";
import { AlertService, AppStateService, ModalService, Status, ZipService, gettext } from "@c8y/ngx-components";
import { BehaviorSubject, Observable } from 'rxjs';
import { get, kebabCase } from 'lodash-es';
import { SettingsService } from "./settings/settings.service";
const CUMULOCITY_JSON = 'cumulocity.json';
const MICROSERVICE_NAME_MAX_LENGTH = 23;


@Injectable({ providedIn: 'root' })
export class ApplicationBinaryService {

    private xhr: XMLHttpRequest;
    progress: BehaviorSubject<number> = new BehaviorSubject<number>(null);

    constructor(
        private modal: ModalService,
        private alertService: AlertService,
        private appStateService: AppStateService,
        private applicationService: ApplicationService,
        private zipService: ZipService,
        private tenantService: TenantService,
        private settingService: SettingsService
    ) { }

    async createAppForArchive(archive, isPackageTypeArchive = false): Promise<IApplication> {
        let isPackage = false;
        const appType = await this.getAppType(archive);
        let appModel: any = {};
        const supportedAppTypes = [ApplicationType.HOSTED, ApplicationType.MICROSERVICE];

        if (supportedAppTypes.includes(appType)) {
            try {
                appModel = await this.getCumulocityJson$(archive).toPromise();
                isPackage = appModel.isPackage;
            } catch (e) {
                // do nothing, we allow having HOSTED applications without the manifest file
            }
        }
        const name = this.getBaseNameFromArchiveOrAppModel(archive, appType, appModel);
        const clearedName = this.removeForbiddenCharacters(name);
        const key = this.getAppKey(appModel, clearedName);
        const contextPath = this.getContextPath(appModel, name);

        const appToSave = {
            resourcesUrl: '/',
            type: appType,
            name,
            key,
            contextPath
        };

        /* if (this.isNameLengthExceeded(name, appType)) {
          const error = new Error();
          error.name = ERROR_TYPE.MICROSERVICE_NAME_TOO_LONG;
          error.message = this.translateService.instant(ERROR_MESSAGES[error.name], {
            name,
            maxChars: MICROSERVICE_NAME_MAX_LENGTH
          });
          throw error;
        } */
        return (
            await this.applicationService.create({
                ...appToSave,
                manifest: {
                    isPackage,
                    ...(appModel?.package && { package: appModel.package })
                } as unknown as IManifest
            })
        ).data;
    }
    private getCumulocityJson$(archive: File): Observable<any> {
        return this.zipService.getJsonData(archive, {
            filename: CUMULOCITY_JSON
        });
    }
    private getAppType(archive: File): Promise<ApplicationType> {
        return this.getCumulocityJson$(archive)
            .toPromise()
            .then(
                data =>
                    get(data, 'type') ||
                    (get(data, 'apiVersion') ? ApplicationType.MICROSERVICE : ApplicationType.HOSTED)
            )
            .catch(() => ApplicationType.HOSTED);
    }
    private getBaseNameFromArchiveOrAppModel(
        archive: any,
        appType: ApplicationType,
        appModel?: IApplication
    ): string {
        let baseName = appModel?.name || archive.name.replace(/\.zip$/i, '');
        if (appType === 'MICROSERVICE') {
            baseName = this.removeVersionFromName(baseName);
        }
        return baseName;
    }

    private removeVersionFromName(name: string) {
        const versionRegExp = /-\d+\.\d+\.\d+(\.\d+)?(-\d+)?(.*)$/;
        return name.replace(versionRegExp, '');
    }

    private isNameLengthExceeded(name, appType) {
        return name.length > MICROSERVICE_NAME_MAX_LENGTH && appType === ApplicationType.MICROSERVICE;
    }
    private removeForbiddenCharacters(str: string): string {
        return str.replace(/[^a-zA-Z0-9-_]/g, '');
    }
    private getAppKey(appModel: IApplication, name: string): string {
        let key = appModel?.key;
        if (!key) {
            key = `${kebabCase(name)}-key`;
        }
        return key;
    }

    private getContextPath(appModel: IApplication, name: string): string {
        return appModel?.contextPath || name.toLowerCase();
    }

    //====================
    async uploadMicroservice(file: File, microservice: IApplication): Promise<void> {
        const subscribeToCurrentTenant = await this.askIfActivationAfterUploadNeeded();
        const microserviceApp: IApplication = await this.uploadArchiveToApp(file, microservice);
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

    private async askIfActivationAfterUploadNeeded(): Promise<boolean> {
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
    async uploadArchiveToApp(
        archive: File,
        app: IApplication,
        isNewVersion = false
    ): Promise<IApplication> {
        let uploadOverrides: IUploadParamsOverride;
        if (isNewVersion) {
            uploadOverrides = await this.getUploadOverrides(archive, app);
        }
        const binaryService = this.applicationService.binary(app);
        this.xhr = binaryService.uploadWithProgressXhr(
            archive,
            this.updateUploadProgress.bind(this),
            '',
            uploadOverrides
        );

        const binaryMo = await binaryService.getXMLHttpResponse(this.xhr);

        return (await this.setAppActiveVersion(app, (binaryMo.binaryId || binaryMo.id) as string)).data;
    }

    private async getUploadOverrides(
        archive: File,
        app: IApplication
    ): Promise<IUploadParamsOverride> {
        const { version } = await this.getCumulocityJson$(archive).toPromise();
        const isInitialPackage = app.applicationVersions?.length === 0;
        return {
            listUrl: 'versions',
            headers: {
                Accept: 'application/vnd.com.nsn.cumulocity.applicationVersion+json;charset=UTF-8;ver=0.9'
            },
            bodyFileProperty: 'applicationBinary',
            requestBody: {
                applicationVersion: { version, ...(isInitialPackage && { tags: ['latest'] }) }
            }
        };
    }
    updateUploadProgress(event): void {
        if (event.lengthComputable) {
            const currentProgress = this.progress.value;
            this.progress.next(currentProgress + (event.loaded / event.total) * (95 - currentProgress));
        }
    }

    setAppActiveVersion(app: IApplication, activeVersionId: string): Promise<IApplication> {
        return this.applicationService.update({ id: app.id, activeVersionId });
    }
    cancelAppCreation(app: IApplication): void {
        if (this.xhr) {
            this.xhr.abort();
        }
        if (app) {
            this.applicationService.delete(app);
        }
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
        // return microservices.sort((a, b) => a.name.localeCompare(b.name));
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

