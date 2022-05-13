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
import { ApplicationService, InventoryBinaryService, InventoryService } from '@c8y/client';
import { AlertService } from '@c8y/ngx-components';
import { AppBuilderExternalAssetsService } from 'app-builder-external-assets';
import { RuntimeWidgetInstallerService } from 'cumulocity-runtime-widget-loader';
import { BehaviorSubject, Observable } from 'rxjs';
import { WidgetCatalog, WidgetModel } from './widget-catalog.model';
import * as semver from "semver";
import * as packageJson from "./../../package.json";
import { catchError } from 'rxjs/operators';

@Injectable()
export class WidgetCatalogService {

  C8Y_VERSION = '1011.0.0';
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
  runtimeLoadingCompleted = false;

  widgetDetailsSource: BehaviorSubject<any> = new BehaviorSubject(null);
  widgetDetails$: Observable<any> = this.widgetDetailsSource.asObservable();
  displayListSource: BehaviorSubject<any> = new BehaviorSubject(null);
  displayListValue$: Observable<any> = this.displayListSource.asObservable();

  private readonly HTTP_HEADERS = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    })
  };

  constructor(private http: HttpClient, private inventoryService: InventoryService,
    private appService: ApplicationService,
    private binaryService: InventoryBinaryService, private alertService: AlertService,
    private runtimeWidgetInstallerService: RuntimeWidgetInstallerService,
    private externalService: AppBuilderExternalAssetsService) {
    this.GATEWAY_URL_GitHubAPI = this.externalService.getURL('GITHUB', 'gatewayURL_Github');
    this.GATEWAY_URL_GitHubAsset = this.externalService.getURL('GITHUB', 'gatewayURL_GitHubAsset');
    this.GATEWAY_URL_GitHubAPI_FallBack = this.externalService.getURL('GITHUB', 'gatewayURL_Github_Fallback');
    this.GATEWAY_URL_GitHubAsset_FallBack = this.externalService.getURL('GITHUB', 'gatewayURL_GitHubAsset_Fallback');
    this.C8Y_VERSION = packageJson.dependencies['@c8y/ngx-components']
    this.GATEWAY_URL_Labcase = this.externalService.getURL('DBCATALOG', 'gatewayURL');
    this.GATEWAY_URL_Labcase_FallBack = this.externalService.getURL('DBCATALOG', 'gatewayURL_Fallback');
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
    return semver.satisfies(this.C8Y_VERSION, widget.requiredPlatformVersion);
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
}
