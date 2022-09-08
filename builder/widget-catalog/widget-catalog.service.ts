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

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { ApplicationRemotePlugins, ApplicationService, IApplication, IManifest, InventoryBinaryService, InventoryService } from '@c8y/client';
import { AppBuilderExternalAssetsService } from 'app-builder-external-assets';
import { RuntimeWidgetInstallerService } from 'cumulocity-runtime-widget-loader';
import { BehaviorSubject, Observable } from 'rxjs';
import { WidgetCatalog, WidgetModel } from './widget-catalog.model';
import * as semver from "semver";
import * as packageJson from "./../../package.json";
import { catchError, delay } from 'rxjs/operators';
import { AlertService, AppStateService, ZipService } from '@c8y/ngx-components';

const c8yVersion = require('./../../package.json')["@c8y/ngx-components"];
@Injectable()
export class WidgetCatalogService {

  C8Y_VERSION = '1015.X.X';
  private WidgetCatalogPath = '/widgetCatalog/widget-catalog.json';
  private DemoCatalogWidgetsPath = '/demoCatalogWidgets/demo-catalog-widgets.json';
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

  constructor(private http: HttpClient, private inventoryService: InventoryService,
    private appService: ApplicationService, private appStateService: AppStateService,
    private binaryService: InventoryBinaryService, private alertService: AlertService,
    private runtimeWidgetInstallerService: RuntimeWidgetInstallerService,
    private externalService: AppBuilderExternalAssetsService, private zipService: ZipService) {
    this.GATEWAY_URL_GitHubAPI = this.externalService.getURL('GITHUB', 'gatewayURL_Github');
    this.GATEWAY_URL_GitHubAsset = this.externalService.getURL('GITHUB', 'gatewayURL_GitHubAsset');
    this.GATEWAY_URL_GitHubAPI_FallBack = this.externalService.getURL('GITHUB', 'gatewayURL_Github_Fallback');
    this.GATEWAY_URL_GitHubAsset_FallBack = this.externalService.getURL('GITHUB', 'gatewayURL_GitHubAsset_Fallback');
    this.C8Y_VERSION = packageJson.dependencies['@c8y/ngx-components']
    this.GATEWAY_URL_Labcase = this.externalService.getURL('DBCATALOG', 'gatewayURL');
    this.GATEWAY_URL_Labcase_FallBack = this.externalService.getURL('DBCATALOG', 'gatewayURL_Fallback');
    this.GATEWAY_URL_GitHub = this.externalService.getURL('GITHUB','gatewayURL_GithubAPI');
    this.GATEWAY_URL_GitHub_FallBack = this.externalService.getURL('GITHUB','gatewayURL_GithubAPI_Fallback');

    this.appStateService.currentApplication.subscribe( app => {
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
    const url =  `${this.GATEWAY_URL_GitHub}${widgetRepoPath}/readme`;
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


  async updateRemotesInCumulocityJson( pluginBinary: any) {
    const remoteModules = pluginBinary?.manifest?.exports;
    let remotes = {};
    remoteModules.forEach((remote: any) => {
        (remotes[pluginBinary.contextPath]  = remotes[pluginBinary.contextPath]  || []).push(remote.module);
    }); 
    const currentApp: IApplication =  (await this.getCurrentApp());
    const c8yJson = await this.getCumulocityJsonFile(currentApp);
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

  async installPackage(packageFile: File, onUpdate: (msg: string, type?: any) => void = ()=>{}) {
      let widgetC8yJson;
          try {
              widgetC8yJson = await this.getCumulocityJson(packageFile).toPromise().then(data =>data);
              if (widgetC8yJson.contextPath === undefined) {
                  // noinspection ExceptionCaughtLocallyJS
                  throw Error("Plugin Package has no context path");
              }
          } catch (e) {
              console.log(e);
              throw Error("Not a valid Plugin Package");
          }
      
      const appList = (await this.appService.list({pageSize: 2000})).data;
      if (appList.some(app => app.contextPath === widgetC8yJson.contextPath)) {
        onUpdate("Widget already deployed! Updating widget...");
        const packageApp = appList.find(app => app.contextPath === widgetC8yJson.contextPath);

        // Upload the binary
        const appBinary = (await this.appService.binary(packageApp).upload(packageFile)).data;
        // Update the app
        await this.appService.update({
            ...widgetC8yJson,
            id: packageApp.id,
            activeVersionId: appBinary.id.toString()
        });
        if(window && window['aptrinsic'] ){
            window['aptrinsic']('track', 'gp_runtime_widget_updated', {
                "widgetName": packageApp.name
            });
        }
        onUpdate("Plugin updated! Adding to application...");
        return this.updateRemotesInCumulocityJson(packageApp)
    } else {
        
        // Create the pluginPackage's app
        let packageApp = (await this.appService.create({
            name: widgetC8yJson.name,
            key: widgetC8yJson.key,
            contextPath: widgetC8yJson.contextPath,
            manifest: { isPackage : true } as unknown as IManifest,
            resourcesUrl: "/",
            type: "HOSTED"
        } as any)).data;

        // Upload the binary
        const appBinary = (await this.appService.binary(packageApp).upload(packageFile)).data;

        // Update the app
        packageApp = (await this.appService.update({
            id: packageApp.id,
            activeVersionId: appBinary.id.toString()
        } as any)).data;

        if(window && window['aptrinsic'] ){
            window['aptrinsic']('track', 'gp_runtime_widget_installed', {
                "widgetName": packageApp.name
            });
        }
        onUpdate("Plugin deployed! Adding to application...");
        return this.updateRemotesInCumulocityJson(packageApp)
    }
  }

  async removePlugin(plugin: any) {
    const remoteModules = plugin?.manifest?.exports;
    let remotes = this.currentApp?.manifest?.remotes;
    remoteModules.forEach((remote: any) => {
        (remotes[plugin.contextPath]  = remotes[plugin.contextPath].filter((p) => p !== remote.module));
    }); 
    const c8yJson = await this.getCumulocityJsonFile(this.currentApp);
    return this.appService.storeAppManifest(this.currentApp, { ...c8yJson, remotes });
  }
}
