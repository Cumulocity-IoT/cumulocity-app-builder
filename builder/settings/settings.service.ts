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

import { Injectable } from '@angular/core';
import { ApplicationService, InventoryService, ICurrentTenant, IApplication, UserGroupService } from '@c8y/client';
import { AlertService, AppStateService } from '@c8y/ngx-components';
import { AppBuilderExternalAssetsService } from 'app-builder-external-assets';
import { AppIdService } from '../app-id.service';
import { from, Subject } from 'rxjs';
import { contextPathFromURL } from '../utils/contextPathFromURL';
import {UpdateableAlert} from "../utils/UpdateableAlert";
import { switchMap, take } from 'rxjs/operators';
import * as delay from "delay";

@Injectable({providedIn: 'root'})
export class SettingsService {
    isAnalyticsProviderLoaded = false;

    private appBuilderConfig: any;
    private appbuilderId: any = '';
    private defaultCustomProperties = {
        gainsightEnabled: "false",
        dashboardCataglogEnabled: "true",
        dashboardVisibility: "true",
        simulatorEnabled: "true",
        navLogoVisibility: "true",
        appUpgradeNotification: "true"
    };
    private currentTenant: ICurrentTenant;
    private analyticsProvider: any = {};
    private isAppConfigNotFound = false;
    delayedTenantUpdateSubject = new Subject<any>();
    private currentApp: IApplication;
    
    constructor(appIdService: AppIdService, private appService: ApplicationService, private inventoryService: InventoryService,
        private alertService: AlertService, private externalAssetService: AppBuilderExternalAssetsService,
        private appStateService: AppStateService ){
            const providerList = this.externalAssetService.getAssetsList('ANALYTICS')
            this.analyticsProvider = providerList.find( provider => provider.key === 'gainsight');
            this.analyticsProvider.providerURL = this.externalAssetService.getURL('ANALYTICS','gainsight');
            appIdService.appIdDelayedUntilAfterLogin$.pipe(take(1)).pipe(switchMap(appId => {
                return from(this.getAppBuilderConfig());
              
            }))
                .subscribe(async app => {
                   // TODO
                });
        }

    /**
     * Get Application Builder Id against custom properties stored.
     * There are posibilites of more than one app builder when subscribed app builder is also available for a tenant 
     */ 
    async getAPPBuilderId() {
        if(this.appbuilderId) { return this.appbuilderId; }
        else {
            const appList = (await this.appService.listByUser(this.appStateService.currentUser.value, { pageSize: 2000 })).data;
            let app: IApplication & {widgetContextPaths?: string[]} = appList.find(app => app.contextPath === contextPathFromURL() &&
             String(app.availability) === 'PRIVATE');
            if (!app) {
                // Own App builder not found. Looking for subscribed one
                app = appList.find(app => app.contextPath === contextPathFromURL());
                if(!app) { throw Error('Could not find current application.');}
            } 
            if(app) { 
                this.appbuilderId = app.id; 
                this.currentApp = app;
            }
            return this.appbuilderId;
        }
    }
    async getAppBuilderConfig() {
        const appBuilderId = await this.getAPPBuilderId();
        const AppBuilderConfigList = (await this.inventoryService.list( {pageSize: 100, query: `type eq AppBuilder-Configuration and appBuilderId eq '${appBuilderId}'`})).data;
        this.appBuilderConfig = (AppBuilderConfigList.length > 0 ? AppBuilderConfigList[0] : null);
        if(!this.appBuilderConfig) { this.isAppConfigNotFound = true; }
    }

    async getCustomProperties() {
        if(this.appBuilderConfig) {
            return (this.appBuilderConfig.customProperties ? this.appBuilderConfig.customProperties : this.defaultCustomProperties);
        } else if(this.isAppConfigNotFound) {
            return this.defaultCustomProperties;
        }
        else {
            await delay(500);
            return await this.getCustomProperties();
        }
    }

    async getAppBuilderMaintenanceStatus() {
        if(this.appBuilderConfig) {
            return (this.appBuilderConfig.underMaintenance ? this.appBuilderConfig.underMaintenance : 'false');
        }
        else {
            await delay(500);
            return await this.getAppBuilderMaintenanceStatus();
        }
    }

    async isDashboardCatalogEnabled() {
        const customProp = await this.getCustomProperties();
        return (!customProp || (customProp  && ( !customProp.dashboardCataglogEnabled || customProp.dashboardCataglogEnabled === "true")));
    }
    
    async isSimulatorEnabled() {
        const customProp = await this.getCustomProperties();
        return (!customProp || (customProp  && ( !customProp.simulatorEnabled || customProp.simulatorEnabled === "true")));
    }
    async saveCustomProperties(customProperties) {
        const creationAlert = new UpdateableAlert(this.alertService);
        creationAlert.update('Updating Custom Properties...');
        const appBuilderId = await this.getAPPBuilderId();
        await delay(500);
        if(this.appBuilderConfig) {
            await this.inventoryService.update({
                id: this.appBuilderConfig.id,
                customProperties,
                c8y_Global: {}
            })
        } else  {
            await this.inventoryService.create({
                    c8y_Global: {},
                    type: "AppBuilder-Configuration",
                    customProperties,
                    appBuilderId
            });
        }
        creationAlert.update(`Custom Properties Updated! Refreshing...`, "success");
        await creationAlert.close(3000);
        location.reload();
    }


    setTenant(tenant: ICurrentTenant | null) {
        this.currentTenant = tenant;
        this.delayedTenantUpdateSubject.next(this.currentTenant);
    }

    getTenantName() {
        return (this.currentTenant && this.currentTenant.name ? this.currentTenant.name : '');
    }

    isGaisigntEnabledFromParent() {
        if(this.currentTenant && this.currentTenant.customProperties && this.currentTenant.customProperties.gainsightEnabled) {
            return (this.currentTenant.customProperties.gainsightEnabled === 'true');
        }  
        // Workaround for 1009 - Incase custom properties null and gainsight active
        if(document && document.getElementById('apt-widget') !== null) { return true; }
        return false;     
    }

    private async isAnalyticsProviderActive() {
        if(this.appBuilderConfig) {
            const customProperties = this.appBuilderConfig?.customProperties;
            return (customProperties && customProperties.gainsightEnabled === 'true')
        }
        else {
            await new Promise(resolve => setTimeout(resolve, 500));
            return await this.isAnalyticsProviderActive();
        }  
    }

    async loadAnalyticsProvider() {
        // if(this.isGaisigntEnabledFromParent() || this.isAnalyticsProviderLoaded) { return false;} //Required for 1009.x.x
        if(this.isAnalyticsProviderLoaded) { return false;}
        else {
            if(this.isGaisigntEnabledFromParent()) { return false; }
            const isProviderActive =  await this.isAnalyticsProviderActive();
            return isProviderActive;
        }
    }

    getAnalyticsProvider() {
        return this.analyticsProvider;
    }

    getIdentity() {
        const email = (this.appStateService.currentUser.getValue().email ? this.appStateService.currentUser.getValue().email :this.appStateService.currentUser.getValue().userName);
        if(email && email.indexOf('@') > -1) {
            return email.split('@')[1];
        }
        return email;
    }

    async isDashboardVisibilitySmartRulesAlarmsExplorer() {
        const customProp = await this.getCustomProperties();
        return (!customProp || (customProp  && ( !customProp.dashboardVisibility || customProp.dashboardVisibility === "true")));
    }

    async isNavlogoVisible() {
        const customProp = await this.getCustomProperties();
        return (!customProp || (customProp  && ( !customProp.navLogoVisibility || customProp.navLogoVisibility === "true")));
    }

    async isAppUpgradeNotification() {
        const customProp = await this.getCustomProperties();
        return (!customProp || (customProp  && ( !customProp.appUpgradeNotification || customProp.appUpgradeNotification === "true")));
    }

    async getAppBuilderConfigs() {
        if(this.appBuilderConfig) {
            return this.appBuilderConfig;
        } else if(this.isAppConfigNotFound) {
            return null;
        }
        else {
            await delay(500);
            return await this.getAppBuilderConfigs();
        }
    }
    async updateAppConfigurationForPlugin(remotes: any, underMaintenance?: any){
        
        if(this.appBuilderConfig) {
            return await this.inventoryService.update({
                id: this.appBuilderConfig.id,
                configs: {remotes},
                c8y_Global: {},
                appBuilderVersion: this.currentApp.manifest.version,
                underMaintenance: underMaintenance
            })
        } else if (this.isAppConfigNotFound) {
            return await this.inventoryService.create({
                c8y_Global: {},
                type: "AppBuilder-Configuration",
                configs: {remotes},
                appBuilderId: this.appbuilderId,
                appBuilderVersion: this.currentApp.manifest.version
            });
        } 
        else  {
            await delay(500);
            return await this.updateAppConfigurationForPlugin(remotes);
        }
    }

    async updateAppBuilderMO() {
        await this.inventoryService.update({
            id: this.appBuilderConfig.id,
            underMaintenance: 'false'
        })
    }
}