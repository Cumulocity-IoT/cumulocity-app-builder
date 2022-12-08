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

import { DOCUMENT } from "@angular/common";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable, isDevMode, Renderer2, RendererFactory2 } from "@angular/core";
import { AlertService, AppStateService } from "@c8y/ngx-components";
import { ApplicationService, UserService } from "@c8y/ngx-components/api";
import { AppBuilderExternalAssetsService } from "app-builder-external-assets";
import { SettingsService } from "../settings/settings.service";
import { AlertMessageModalComponent } from "../utils/alert-message-modal/alert-message-modal.component";
import { ProgressIndicatorModalComponent } from "../utils/progress-indicator-modal/progress-indicator-modal.component";
import { ProgressIndicatorService } from "../utils/progress-indicator-modal/progress-indicator.service";
import * as JSZip from "jszip";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { Observable } from "rxjs";
import { AppBuilderConfig } from "./app-builder-upgrade.model";
import { AppIdService } from "../app-id.service";
import { catchError,delay,first} from "rxjs/operators";
import * as semver from "semver";
import { IApplication } from "@c8y/client";
import * as _ from 'lodash';
import { WidgetCatalogService } from "./../widget-catalog/widget-catalog.service";
import { WidgetCatalog } from "./../widget-catalog/widget-catalog.model";

const appVersion = require('../../package.json').version;
@Injectable({ providedIn: 'root' })
export class AppBuilderUpgradeService {
    private renderer: Renderer2;
    private progressModal: BsModalRef;
    private GATEWAY_URL_GitHubAsset = '';
    private GATEWAY_URL_GitHubAPI = '';
    private GATEWAY_URL_Labcase = '';
    private GATEWAY_URL_GitHubAPI_FallBack = '';
    private GATEWAY_URL_Labcase_FallBack = '';
    private GATEWAY_URL_GitHubAsset_FallBack = '';
  //  private appBuilderConfigPath = '/appbuilderConfig/app-builder-config.json';
    private appBuilderConfigPath = '/appbuilderConfig/app-builder-config.json?ref=development';
    private devBranchPath = "?ref=development";
    private appBuilderConfigModel: AppBuilderConfig;
    private applicationsList = [];
    private currentApp: IApplication;
    userHasAdminRights: boolean;

    public appVersion: string =  appVersion;
    public newVersion: boolean = false;
    public errorReported = false;
    

    constructor(private http: HttpClient, public rendererFactory: RendererFactory2, @Inject(DOCUMENT) private _document: Document,
        private modalService: BsModalService, private progressIndicatorService: ProgressIndicatorService,
        private appService: ApplicationService, private externalService: AppBuilderExternalAssetsService,
        private settingService: SettingsService, private userService: UserService, private appStateService: AppStateService,
        appIdService: AppIdService, private alertService: AlertService, private widgetCatalogService: WidgetCatalogService) {
        this.GATEWAY_URL_GitHubAsset = this.externalService.getURL('GITHUB', 'gatewayURL_GitHubAsset');
        this.GATEWAY_URL_GitHubAPI = this.externalService.getURL('GITHUB', 'gatewayURL_Github');
        this.GATEWAY_URL_Labcase = this.externalService.getURL('DBCATALOG', 'gatewayURL');
        this.GATEWAY_URL_GitHubAPI_FallBack = this.externalService.getURL('GITHUB','gatewayURL_Github_Fallback');
        this.GATEWAY_URL_GitHubAsset_FallBack =  this.externalService.getURL('GITHUB','gatewayURL_GitHubAsset_Fallback');
        this.GATEWAY_URL_Labcase_FallBack = this.externalService.getURL('DBCATALOG', 'gatewayURL_Fallback');

        appIdService.appIdDelayedUntilAfterLogin$.pipe(first()).subscribe(() => {
            this.userHasAdminRights = userService.hasRole(appStateService.currentUser.value, "ROLE_APPLICATION_MANAGEMENT_ADMIN")
                this.appStateService.currentApplication.subscribe( app => {
                    this.currentApp = app;
                    this.verifyPlugins();
                });
        });
    }

    private readonly HTTP_HEADERS = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        })
    };

    async loadUpgradeBanner() {
        const isAppBuilderUpgradeNotification = await this.settingService.isAppUpgradeNotification();
        if (this.userHasAdminRights && isAppBuilderUpgradeNotification) {
            await this.getAppBuilderConfig();
        }
    }

    private createAndRenderBanner() {
        this.renderer = this.rendererFactory.createRenderer(null, null);
        const appbuilderUpgradeBanner = this.renderer.createElement("div");
        const textElement = this.renderer.createText(`Application Builder ${this.appBuilderConfigModel.versionInfo.updateAvailable} available.`);
        const textElementUpdateLink = this.renderer.createText(' Update now!');
        const updateLink = this.renderer.createElement("a");
        this.renderer.addClass(appbuilderUpgradeBanner, 'app-builder-upgrade-banner');
        this.renderer.appendChild(appbuilderUpgradeBanner, textElement);
        this.renderer.appendChild(updateLink, textElementUpdateLink);
        this.renderer.appendChild(appbuilderUpgradeBanner, updateLink);
        this.renderer.appendChild(this._document.body, appbuilderUpgradeBanner);
        const clicklistener = this.renderer.listen(updateLink, 'click', (evt) => this.initiateUpgrade(evt));
    }

    private async getAppBuilderConfig() {
        await this.fetchAppBuilderConfig()
        .subscribe(async appBuilderConfig => {
            this.appBuilderConfigModel = appBuilderConfig;
            let isValidContextPath = false;
            if (this.appBuilderConfigModel && this.appBuilderConfigModel.versionInfo) {
                if (this.isLatestVersionAvailable(this.appVersion,this.appBuilderConfigModel.versionInfo.updateAvailable)) {
                    this.newVersion = true;
                } else {
                    this.newVersion = false;
                }
                const appList = await this.getApplicationList();
                const currentTenantId = this.settingService.getTenantName();
                let appBuilderApp = appList.find( 
                    app => this.appBuilderConfigModel.versionInfo.contextPath && 
                    app.contextPath === this.appBuilderConfigModel.versionInfo.contextPath &&  (String(app.availability) === 'PRIVATE'));
                if(!appBuilderApp) {
                    // Checking app builder subscribed one..
                    appBuilderApp = appList.find( 
                        app => this.appBuilderConfigModel.versionInfo.contextPath && 
                        app.contextPath === this.appBuilderConfigModel.versionInfo.contextPath );
                }
                const appBuilderTenantId = (appBuilderApp && appBuilderApp.owner && appBuilderApp.owner.tenant ? appBuilderApp.owner.tenant.id : undefined);
                if(appBuilderApp && currentTenantId === appBuilderTenantId) { isValidContextPath = true;} 
                /* else {
                    this.alertService.warning("Unable to detect valid Application Builder", 
                    "Context Path of installed version of application builder is not matching with server");
                } */
            }
            if (this.newVersion && isValidContextPath) {
                this.createAndRenderBanner();
            }
        });
    }

    private isLatestVersionAvailable(currentVersion: string, availableVersion: string) {
        return semver.lt(currentVersion, availableVersion);
    }

    private initiateUpgrade(event: any) {
        const currentHost = window.location.host.split(':')[0];
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            this.alertService.warning("Application Updation isn't supported when running Application Builder on localhost.");
            return;
        }
        const confirmMsg = this.appBuilderConfigModel?.versionInfo?.confirmMsg;
        const alertMessage = {
            title: 'Installation Confirmation',
            description: (confirmMsg ? confirmMsg: `You are about to upgrade Application Builder.
            Do you want to proceed?`),
            type: 'info',
            alertType: 'confirm', //info|confirm
            confirmPrimary: true //confirm Button is primary
        }
        const upgradeAppBuilderDialogRef = this.alertModalDialog(alertMessage);
        upgradeAppBuilderDialogRef.content.event.subscribe(async data => {
            if (data && data.isConfirm) {
                this.showProgressModalDialog('Updating Application Builder...');
                const updateURL = this.appBuilderConfigModel.versionInfo.updateURL;
                const successMsg = this.appBuilderConfigModel?.versionInfo?.successMsg;
                const fileName = updateURL.replace(/^.*[\\\/]/, '');
                await this.downloadAndInstall(updateURL, fileName, true, 'UPGRADE');
                this.progressModal.hide();
                if(!this.errorReported) {
                    const postUpdationMsg = {
                        title: 'Updation Completed',
                        description: (successMsg ? successMsg: 'Application Builder is successfully updated.'),
                        type: 'info',
                        alertType: 'info' //info|confirm
                    };
                    const postUpdationDialogRef = this.alertModalDialog(postUpdationMsg);
                    await postUpdationDialogRef.content.event.subscribe(data => {
                        window.location.reload();
                    });
                }
            }
        });
    }

    showProgressModalDialog(message: string): void {
        this.progressModal = this.modalService.show(ProgressIndicatorModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    hideProgressModalDialog() {
        this.progressModal.hide();
    }

    alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    async downloadAndInstall(binaryLocation: string, fileName: string, isGithub: boolean, installationType: 'INSTALL' | 'UPGRADE' | 'ANY') {
        this.errorReported = false;
        if (!binaryLocation) {
            console.error('Missing link to download binary');
            this.alertService.danger("Missing link to download binary");
            this.errorReported = true;
            return;
        }
        this.progressIndicatorService.setProgress(20);
        const data: ArrayBuffer = await this.downloadBinary(binaryLocation, isGithub);
        const blob = new Blob([data], {
            type: 'application/zip'
        });
        const binaryFile = new File([blob], fileName, { type: "'application/zip'" })
        this.progressIndicatorService.setProgress(30);
        let appC8yJson;
        try {
            this.progressIndicatorService.setProgress(40);
            const binaryZip = await JSZip.loadAsync(binaryFile);
            appC8yJson = JSON.parse(await binaryZip.file('cumulocity.json').async("text"));
            if (appC8yJson.contextPath === undefined) {
                this.alertService.danger("Unable to download new version.");
                this.errorReported = true;
                throw Error("Application's Context Path not found.");
            }
        } catch (e) {
            console.log(e);
            this.alertService.danger("Unable to download new version.");
            this.errorReported = true;
            throw Error("Not a Binary");
        }

        await this.upgradeApp(binaryFile, appC8yJson, installationType);
    }

    private async upgradeApp(binaryFile: any, appC8yJson: any, installationType: any) {
        if (installationType !== "INSTALL") {
            const appList = await this.getApplicationList();
            const appName = appList.find(app => app.contextPath === appC8yJson.contextPath && app.availability === 'PRIVATE');
            if(appName) {
                await this.uploadApp(appName, binaryFile, appC8yJson);
            } 
            else{
                const appName = appList.find(app => app.contextPath === appC8yJson.contextPath);
                const appTenantId = (appName && appName.owner && appName.owner.tenant ? appName.owner.tenant.id : undefined);
                if(appName && (String(appName.availability) === 'PRIVATE' || appTenantId === this.settingService.getTenantName())) {
                    await this.uploadApp(appName, binaryFile, appC8yJson);
                }
                else {
                    this.alertService.danger("Unable to upgrade application!", "Please verify that you are owner of the tenant and not using subscribed application.")
                    this.errorReported = true;
                    return;
                }
            }
        } else if(installationType !== "UPGRADE") {
            // Create the custom App
            this.progressIndicatorService.setProgress(50);
            const custmApp = (await this.appService.create({
                ...appC8yJson,
                resourcesUrl: "/",
                type: "HOSTED"
            } as any)).data;

            // Upload the binary
            const appBinary = (await this.appService.binary(custmApp).upload(binaryFile)).data;
            this.progressIndicatorService.setProgress(70);
            // Update the app
            await this.appService.update({
                id: custmApp.id,
                activeVersionId: appBinary.id.toString()
            });
            if (window && window['aptrinsic']) {
                window['aptrinsic']('track', 'gp_application_installed', {
                    "appBuilder": custmApp.name,
                    "tenantId": this.settingService.getTenantName(),
                });
            }
        } else {
            this.alertService.danger("Unable to Install/Upgrade your application.", "Please verify that you are not using subscribed application for upgrade. If you are using subscribed application, then try again from Management/Enterprise tenant.")
            this.errorReported = true;
            return;
        }
        this.progressIndicatorService.setProgress(80);
    }

    private async uploadApp(appName: any, binaryFile: any, appC8yJson: any){
        this.progressIndicatorService.setProgress(50);
                // Upload the binary
                const appBinary = (await this.appService.binary(appName).upload(binaryFile)).data;
                // Update the app
                this.progressIndicatorService.setProgress(70);
                await this.appService.update({
                    ...appC8yJson,
                    id: appName.id,
                    activeVersionId: appBinary.id.toString()
                });
                if (window && window['aptrinsic']) {
                    window['aptrinsic']('track', 'gp_application_updated', {
                        "appBuilder": appName.name,
                        "tenantId": this.settingService.getTenantName(),
                    });
                }
    }
    private downloadBinary(binaryId: string, isGithub: boolean): Promise<ArrayBuffer> {
        let url = `${this.GATEWAY_URL_GitHubAsset}${binaryId}`;
        if (!isGithub) {
            url = `${this.GATEWAY_URL_Labcase}${binaryId}`
        }
        return this.http.get(url, {
            responseType: 'arraybuffer'
        })
        .pipe(catchError(err => {
            console.log('App Builder Upgrade Binary: Error in primary endpoint! using fallback...');
            let url = `${this.GATEWAY_URL_GitHubAsset_FallBack}${binaryId}`;
            if (!isGithub) {
                url = `${this.GATEWAY_URL_Labcase_FallBack}${binaryId}`
            }
            return this.http.get(url, {
                responseType: 'arraybuffer'
            })
          }))        
        .toPromise();
    }

    fetchAppBuilderConfig(): Observable<AppBuilderConfig> {
        const url = `${this.GATEWAY_URL_GitHubAPI}${this.appBuilderConfigPath}`;
        const urlFallBack = `${this.GATEWAY_URL_GitHubAPI_FallBack}${this.appBuilderConfigPath}`;
        if(isDevMode()){
          return this.http.get<AppBuilderConfig>(`${url}${this.devBranchPath}`, this.HTTP_HEADERS)
          .pipe(catchError(err => {
            console.log('App Builder Config: Error in primary endpoint! using fallback...');
            return this.http.get<AppBuilderConfig>(`${urlFallBack}${this.devBranchPath}`, this.HTTP_HEADERS)
          }));
        }
        return this.http.get<AppBuilderConfig>(`${url}`, this.HTTP_HEADERS)
        .pipe(catchError(err => {
            console.log('App Builder Config: Error in primary endpoint! using fallback...');
            return this.http.get<AppBuilderConfig>(`${urlFallBack}`, this.HTTP_HEADERS)
          }));
    }

    async getApplicationList() {
        if(this.applicationsList && this.applicationsList.length > 0) { return this.applicationsList; }
        this.applicationsList = (await this.appService.list({ pageSize: 2000, withTotalPages: true }) as any).data ;
        return this.applicationsList;
    }

    private async verifyPlugins() {
        const appVersion =  this.currentApp?.manifest?.version;
        const appRemotes = this.currentApp?.config.remotes;
        const appBuilderConfig = (await this.settingService.getAppBuilderConfigs());
        if (appBuilderConfig?.configs?.remotes && Object.keys(appBuilderConfig?.configs?.remotes).length > 0) {
            if (appVersion === appBuilderConfig?.appBuilderVersion && _.isEqual(appRemotes, appBuilderConfig?.configs.remotes)) {
                console.info('All plugins are installed!');
            } else if (this.userHasAdminRights) {
                if (appVersion !== appBuilderConfig?.appBuilderVersion) {
                    this.showProgressModalDialog('Verifying plugins! Please wait...');
                    const widgetCatalog: WidgetCatalog = await new Promise(resolve => this.widgetCatalogService.fetchWidgetCatalog()
                        .subscribe(widgets => resolve(widgets),
                            error => {
                                this.logError();
                            })) as any;
                    widgetCatalog.widgets = await this.widgetCatalogService.filterInstalledWidgets(widgetCatalog, this.userHasAdminRights);
                    const totalRemotes = (appBuilderConfig?.configs?.remotes ? Object.keys(appBuilderConfig?.configs?.remotes).length : 0);
                    const eachRemoteProgress: number = (totalRemotes > 1 ? (90 / totalRemotes) : 0);
                    let overallProgress = 0;
                    if (totalRemotes > 1) { this.progressIndicatorService.setOverallProgress(overallProgress); }
                    const appBuilderConfigRemotes = this.widgetCatalogService.removeVersionFromPluginRemotes(appBuilderConfig?.configs?.remotes);
                    for (let remote of appBuilderConfigRemotes) {
                        let pluginBinary = widgetCatalog.widgets.find(widget => widget.contextPath === remote?.pluginContext && widget.isCompatible);
                        if (pluginBinary) {
                            this.progressIndicatorService.setProgress(0);
                            this.progressIndicatorService.setMessage(`Installing ${pluginBinary.title}`);
                            this.progressIndicatorService.setProgress(10);
                            const binary = await new Promise(resolve => this.widgetCatalogService.downloadBinary(pluginBinary.binaryLink)
                                .subscribe(binaryData => resolve(binaryData), error => {
                                    this.logError();
                                })) as any;
                            const blob = new Blob([binary], {
                                type: 'application/zip'
                            });
                            const fileName = pluginBinary.binaryLink.replace(/^.*[\\\/]/, '');
                            const fileOfBlob = new File([blob], fileName);
                            await this.widgetCatalogService.installPackage(fileOfBlob);
                        }
                        overallProgress = overallProgress + eachRemoteProgress;
                        this.progressIndicatorService.setOverallProgress(overallProgress)
                    }
                    this.progressModal.hide()
                    this.showProgressModalDialog('Refreshing...');
                    await new Promise(resolve => setTimeout(resolve, 4000));
                    window.location.reload();
                }
                else {
                    this.showProgressModalDialog('Verifying plugins! Please wait...');
                    await this.widgetCatalogService.updateRemotesToAppBuilderConfig();
                    this.progressModal.hide();
                    this.showProgressModalDialog('Refreshing...');
                    await new Promise(resolve => setTimeout(resolve, 4000));
                    window.location.reload();
                }
            }
            else {
                this.alertService.danger('Plugin verification required! Please login with Admin permission and refresh this page.')
            }
        } 
    }

    private logError() {
        this.alertService.danger("Unable verify plugin due to technical error! Please try after sometime.");
        this.progressModal.hide();
    }
}