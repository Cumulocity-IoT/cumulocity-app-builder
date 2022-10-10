/*
* Copyright (c) 2022 Software AG, Darmstadt, Germany and/or its licensors
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

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { ApplicationService, IApplication, IManifest } from '@c8y/client';
import { AppBuilderExternalAssetsService } from 'app-builder-external-assets';
import { RuntimeWidgetInstallerService } from 'cumulocity-runtime-widget-loader';
import { BehaviorSubject, Observable } from 'rxjs';
import { WidgetCatalog, WidgetModel } from './widget-catalog.model';
import * as semver from "semver";
import * as packageJson from "./../../package.json";
import { catchError, delay } from 'rxjs/operators';
import { AlertService, AppStateService, ZipService } from '@c8y/ngx-components';
import { SettingsService } from './../settings/settings.service';
import { ProgressIndicatorService } from '../utils/progress-indicator-modal/progress-indicator.service';


const c8yVersion = require('./../../package.json')["@c8y/ngx-components"];
@Injectable()
export class WidgetCatalogService {

  C8Y_VERSION = '1015.X.X';
  private WidgetCatalogPath = '/widgetCatalog/widget-catalog.json';
 // private DemoCatalogWidgetsPath = '/demoCatalogWidgets/demo-catalog-widgets.json';
  private DemoCatalogWidgetsPath = '/demoCatalogWidgets/demo-catalog-widgets.json?ref=development';
  private devBranchPath = "?ref=development";
  private GATEWAY_URL_GitHubAsset = '';
  private GATEWAY_URL_GitHubAPI = '';
  private GATEWAY_URL_GitHubAsset_FallBack = '';
  private GATEWAY_URL_GitHubAPI_FallBack = '';
  private GATEWAY_URL_Labcase = '';
  private GATEWAY_URL_Labcase_FallBack = '';
  private CATALOG_LABCASE_ID = '';
  private GATEWAY_URL_GitHub = '';
  private GATEWAY_URL_GitHub_FallBack = '';
  runtimeLoadingCompleted = true;
  private currentApp: IApplication = null;

  widgetDetailsSource: BehaviorSubject<any> = new BehaviorSubject(null);
  widgetDetails$: Observable<any> = this.widgetDetailsSource.asObservable();
  displayListSource: BehaviorSubject<any> = new BehaviorSubject(null);
  displayListValue$: Observable<any> = this.displayListSource.asObservable();

  displayListSourceMoreWidgets: BehaviorSubject<any> = new BehaviorSubject(null);
  displayListValueMoreWidgets$: Observable<any> = this.displayListSourceMoreWidgets.asObservable();

  private readonly HTTP_HEADERS = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    })
  };

  constructor(private http: HttpClient,
    private appService: ApplicationService, private appStateService: AppStateService,
    private runtimeWidgetInstallerService: RuntimeWidgetInstallerService, private settingsService: SettingsService,
    private externalService: AppBuilderExternalAssetsService, private zipService: ZipService,
    private progressIndicatorService: ProgressIndicatorService, private alertService: AlertService) {
    this.GATEWAY_URL_GitHubAPI = this.externalService.getURL('GITHUB', 'gatewayURL_Github');
    this.GATEWAY_URL_GitHubAsset = this.externalService.getURL('GITHUB', 'gatewayURL_GitHubAsset');
    this.GATEWAY_URL_GitHubAPI_FallBack = this.externalService.getURL('GITHUB', 'gatewayURL_Github_Fallback');
    this.GATEWAY_URL_GitHubAsset_FallBack = this.externalService.getURL('GITHUB', 'gatewayURL_GitHubAsset_Fallback');
    this.C8Y_VERSION = packageJson.dependencies['@c8y/ngx-components']
    this.GATEWAY_URL_Labcase = this.externalService.getURL('DBCATALOG', 'gatewayURL');
    this.GATEWAY_URL_Labcase_FallBack = this.externalService.getURL('DBCATALOG', 'gatewayURL_Fallback');
    this.GATEWAY_URL_GitHub = this.externalService.getURL('GITHUB', 'gatewayURL_GithubAPI');
    this.GATEWAY_URL_GitHub_FallBack = this.externalService.getURL('GITHUB', 'gatewayURL_GithubAPI_Fallback');

    this.appStateService.currentApplication.subscribe(app => {
      this.currentApp = app;
    });
  }


  fetchWidgetCatalog(): Observable<WidgetCatalog> {
    const url = `${this.GATEWAY_URL_GitHubAPI}${this.WidgetCatalogPath}`;
    const urlFallBack = `${this.GATEWAY_URL_GitHubAPI_FallBack}${this.WidgetCatalogPath}`;
    if (isDevMode()) {
      return this.http.get<WidgetCatalog>(`${url}${this.devBranchPath}`, this.HTTP_HEADERS)
        .pipe(catchError(err => {
          console.log('Fetch Widget Catalog: Error in primary endpoint! using fallback...');
          return this.http.get<WidgetCatalog>(`${urlFallBack}${this.devBranchPath}`, this.HTTP_HEADERS)
        }));
    }
    return this.http.get<WidgetCatalog>(`${url}`, this.HTTP_HEADERS)
      .pipe(catchError(err => {
        console.log('Fetch Widget Catalog: Error in primary endpoint! using fallback...');
        return this.http.get<WidgetCatalog>(`${urlFallBack}`, this.HTTP_HEADERS)
      }));
  }

  fetchWidgetForDemoCatalog(): Observable<WidgetCatalog> {
    const url = `${this.GATEWAY_URL_GitHubAPI}${this.DemoCatalogWidgetsPath}`;
    const urlFallBack = `${this.GATEWAY_URL_GitHubAPI_FallBack}${this.DemoCatalogWidgetsPath}`;
    if (isDevMode()) {
      return this.http.get<WidgetCatalog>(`${url}${this.devBranchPath}`, this.HTTP_HEADERS)
        .pipe(catchError(err => {
          console.log('Fetch Widget For Demo Catalog: Error in primary endpoint! using fallback...');
          return this.http.get<WidgetCatalog>(`${urlFallBack}${this.devBranchPath}`, this.HTTP_HEADERS)
        }));
    }
    return this.http.get<WidgetCatalog>(`${url}`, this.HTTP_HEADERS)
      .pipe(catchError(err => {
        console.log('Fetch Widget For Demo Catalog: Error in primary endpoint! using fallback...');
        return this.http.get<WidgetCatalog>(`${urlFallBack}`, this.HTTP_HEADERS)
      }));
  }

  async installWidget(binary: Blob, widget: WidgetModel) {
    await this.runtimeWidgetInstallerService.installWidget(binary, (msg, type) => { }, widget);
  }

  downloadBinary(binaryId: string): Observable<ArrayBuffer> {
    return this.http.get(`${this.GATEWAY_URL_GitHubAsset}${binaryId}`, {
      responseType: 'arraybuffer'
    })
      .pipe(catchError(err => {
        console.log('Widget Catalog: Download Binary: Error in primary endpoint! using fallback...');
        return this.http.get(`${this.GATEWAY_URL_GitHubAsset_FallBack}${binaryId}`, {
          responseType: 'arraybuffer'
        })
      }));
  }

  isCompatiblieVersion(widget: any) {
    if (!widget || !widget.requiredPlatformVersion) return false;
    const major = '>=' + semver.major(this.C8Y_VERSION) + '.X.X';
    return semver.satisfies(widget.requiredPlatformVersion, major);
  }

  isLatestVersionAvailable(widget: WidgetModel) {
    return semver.lt(widget.installedVersion, widget.version);
  }

  compareWidgetVersions(widget1Version: string, Widget2Version: string) {
    return semver.lt(widget1Version, Widget2Version);
  }

  checkInstalledVersion(widget: WidgetModel) {
    if (!widget.installedVersion) return true;

    if (widget.installedVersion?.toLocaleLowerCase().includes('beta') ||
      widget.installedVersion?.toLocaleLowerCase().includes('rc')) return true;

    const major = '>=' + semver.major(widget.installedVersion) + '.0.0';
    return semver.satisfies(widget.version, major);
  }

  downloadBinaryFromLabcase(binaryId: string): Observable<ArrayBuffer> {
    return this.http.get(`${this.GATEWAY_URL_Labcase}${binaryId}`, {
      responseType: 'arraybuffer'
    })
      .pipe(catchError(err => {
        console.log('Widget Catalog: Download Binary from Labcase: Error in primary endpoint! using fallback...');
        return this.http.get(`${this.GATEWAY_URL_Labcase_FallBack}${binaryId}`, {
          responseType: 'arraybuffer'
        })
      }));
  }

  setWidgetDetails(detail: any) {
    this.widgetDetailsSource.next(detail);
  }

  setDisplayListValue(value: any) {
    this.displayListSource.next(value);
  }

  setDisplayListValueMoreWidgets(value: any) {
    this.displayListSourceMoreWidgets.next(value);
  }
  getWidgetDetailsFromRepo(widgetRepoPath): Observable<any> {
    const url = `${this.GATEWAY_URL_GitHub}${widgetRepoPath}/readme`;
    const urlFallBack = `${this.GATEWAY_URL_GitHub_FallBack}${widgetRepoPath}/readme`;
    return this.http.get(`${url}`, {
      responseType: 'text'
    }).pipe(catchError(err => {
      console.log('Widget Catalog: Get Widget Details From Readme: Error in primary endpoint! using fallback...');
      return this.http.get(`${urlFallBack}`, {
        responseType: 'text'
      })
    }));
  }


  async updateRemotesInCumulocityJson(pluginBinary: any) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.progressIndicatorService.setProgress(50);
    const remoteModules = pluginBinary?.manifest?.exports;
    const currentApp: IApplication = (await this.getCurrentApp());
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.progressIndicatorService.setProgress(75);
    const c8yJson = await this.getCumulocityJsonFile(currentApp);
    let remotes = (c8yJson?.remotes ? c8yJson?.remotes : {});
    remoteModules.forEach((remote: any) => {
      (remotes[pluginBinary.contextPath] = remotes[pluginBinary.contextPath] || []).push(remote.module);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.progressIndicatorService.setProgress(95);
    // updating config MO to retain widget status
    await this.settingsService.updateAppConfigurationForPlugin(remotes, currentApp.id, currentApp.manifest.version)
    return this.appService.storeAppManifest(this.currentApp, { ...c8yJson, remotes });
  }

  async updateRemotesFromAppBuilderConfig( remotes: any) {
    
    const currentApp: IApplication =  (await this.getCurrentApp());
    const c8yJson = await this.getCumulocityJsonFile(currentApp);
    if(c8yJson?.remotes) { 
      remotes = {...remotes, ...c8yJson?.remotes};
    }
    await this.settingsService.updateAppConfigurationForPlugin(remotes, this.currentApp.id, this.currentApp.manifest.version);
    return this.appService.storeAppManifest(this.currentApp, { ...c8yJson, remotes });
  }

  private async getCumulocityJsonFile(app: IApplication) {
    const c8yJson = await this.appService.getAppManifest(app);
    if (!c8yJson.imports) {
      c8yJson.imports = {};
    }
    return c8yJson;
  }

  private getCumulocityJson(archive: File): Observable<any> {
    return this.zipService.getJsonData(archive, {
      filename: 'cumulocity.json'
    });
  }

  async getCurrentApp() {
    if (!this.currentApp) {
      await delay(1000);
      return this.getCurrentApp();
    }
    return this.currentApp;
  }

  async installPackage(packageFile: File, onUpdate: (msg: string, type?: any) => void = () => { }) {
    this.progressIndicatorService.setProgress(30);
    let widgetC8yJson;
    try {
      widgetC8yJson = await this.getCumulocityJson(packageFile).toPromise().then(data => data);
      if (widgetC8yJson.contextPath === undefined) {
        this.alertService.danger("Plugin Package has no context path.");
        throw Error("Plugin Package has no context path");
      }
    } catch (e) {
      console.log(e);
      this.alertService.danger("Not a valid Plugin Package.");
      throw Error("Not a valid Plugin Package");
    }
    const appList = (await this.appService.list({ pageSize: 2000 })).data;
    if (appList.some(app => app.contextPath === widgetC8yJson.contextPath)) {
      this.progressIndicatorService.setProgress(35);
      onUpdate("Widget already deployed! Updating widget...");
      const packageApp = appList.find(app => app.contextPath === widgetC8yJson.contextPath);

      // Upload the binary
      const appBinary = (await this.appService.binary(packageApp).upload(packageFile)).data;
      // Update the app
      this.progressIndicatorService.setProgress(40);
      await this.appService.update({
        ...widgetC8yJson,
        id: packageApp.id,
        activeVersionId: appBinary.id.toString()
      });
      if (window && window['aptrinsic']) {
        window['aptrinsic']('track', 'gp_runtime_widget_updated', {
          "widgetName": packageApp.name
        });
      }
      onUpdate("Plugin updated! Adding to application...");
      return this.updateRemotesInCumulocityJson(packageApp)
    } else {
      this.progressIndicatorService.setProgress(35);
      // Create the pluginPackage's app
      let packageApp = (await this.appService.create({
        name: widgetC8yJson.name,
        key: widgetC8yJson.key,
        contextPath: widgetC8yJson.contextPath,
        manifest: { isPackage: true } as unknown as IManifest,
        resourcesUrl: "/",
        type: "HOSTED"
      } as any)).data;

      // Upload the binary
      const appBinary = (await this.appService.binary(packageApp).upload(packageFile)).data;

      // Update the app
      this.progressIndicatorService.setProgress(40);
      packageApp = (await this.appService.update({
        id: packageApp.id,
        activeVersionId: appBinary.id.toString()
      } as any)).data;

      if (window && window['aptrinsic']) {
        window['aptrinsic']('track', 'gp_runtime_widget_installed', {
          "widgetName": packageApp.name
        });
      }
      onUpdate("Plugin deployed! Adding to application...");
      return this.updateRemotesInCumulocityJson(packageApp)
    }
  }

  async removePlugin(remotes: any) {
    const c8yJson = await this.getCumulocityJsonFile(this.currentApp);
    this.progressIndicatorService.setProgress(95);
      // updating config MO to retain widget status
    await this.settingsService.updateAppConfigurationForPlugin(remotes, this.currentApp.id, this.currentApp.manifest.version);
    return this.appService.storeAppManifest(this.currentApp, { ...c8yJson, remotes });
  }

  async filterInstalledWidgets(widgetCatalog: WidgetCatalog, userHasAdminRights: boolean) {
    if (!widgetCatalog || !widgetCatalog.widgets
        || widgetCatalog.widgets.length === 0) {
        return;
    }

    const currentApp: IApplication =  (await this.getCurrentApp());
    const installedPlugins = currentApp?.manifest?.remotes;
    for(let widget of widgetCatalog.widgets) {
        const widgetObj = (installedPlugins  && installedPlugins[widget.contextPath] && installedPlugins[widget.contextPath].length> 0);
        widget.installed = (widgetObj != undefined && widgetObj);
        widget.isCompatible = this.isCompatiblieVersion(widget);
        this.actionFlagGetWidgets(widget, userHasAdminRights);
    }
   
     return widgetCatalog.widgets.filter(widget => !widget.installed);
  }

  /**
     * compatible: 001
     * non compatible: 002
     * refresh: 003
     * force upgrade 004 (my widget)
     * invisible 000
     */
  actionFlagGetWidgets(widget: WidgetModel, userHasAdminRights: boolean) {

    if (userHasAdminRights) {
      if (widget.isCompatible && !widget.installed) { widget.actionCode = '001'; }
      else if (!widget.isCompatible && !widget.installed) { widget.actionCode = '002'; }
      else if (widget.isReloadRequired && widget.installed) { widget.actionCode = '003'; }
      else { widget.actionCode = '000'; }
    } else {
      widget.actionCode = '000';
    }
  }
}
