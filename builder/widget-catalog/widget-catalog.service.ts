import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApplicationService, InventoryBinaryService, InventoryService } from '@c8y/client';
import { AlertService } from '@c8y/ngx-components';
import { AppBuilderExternalAssetsService } from 'app-builder-external-assets';
import { RuntimeWidgetInstallerService } from 'cumulocity-runtime-widget-loader';
import { Observable } from 'rxjs';
import { WidgetCatalog, WidgetModel } from './widget-catalog.model';
import * as semver from "semver";
import { catchError } from 'rxjs/operators';

@Injectable()
export class WidgetCatalogService {

    C8Y_VERSION = '1010.0.8';
    private GATEWAY_URL = '';
    private GATEWAY_URL_FallBack = '';
    private CATALOG_LABCASE_ID = '';
    runtimeLoadingCompleted = false;
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
        this.GATEWAY_URL = this.externalService.getURL('WIDGETCATALOG', 'gatewayURL');
        this.GATEWAY_URL_FallBack = this.externalService.getURL('WIDGETCATALOG', 'gatewayURL_Fallback');
        this.CATALOG_LABCASE_ID = this.externalService.getURL('WIDGETCATALOG', 'labcaseId');
    }


    fetchWidgetCatalog(): Observable<WidgetCatalog> {
        return this.http.get<WidgetCatalog>(`${this.GATEWAY_URL}${this.CATALOG_LABCASE_ID}`, this.HTTP_HEADERS)
        .pipe(catchError(err => {
          console.log('Fetch Widget Catalog: Error in primary endpoint! using fallback...');
          return this.http.get<WidgetCatalog>(`${this.GATEWAY_URL_FallBack}${this.CATALOG_LABCASE_ID}`, this.HTTP_HEADERS)
        }));
    }

    async installWidget(binary: Blob, widget: WidgetModel) {
      await this.runtimeWidgetInstallerService.installWidget(binary, (msg, type) => { }, widget);
    }

    downloadBinary(binaryId: string): Observable<ArrayBuffer> {
      return this.http.get(`${this.GATEWAY_URL}${binaryId}`, {
          responseType: 'arraybuffer'
      })
      .pipe(catchError(err => {
        console.log('Widget Catalog: Download Binary: Error in primary endpoint! using fallback...');
        return this.http.get(`${this.GATEWAY_URL_FallBack}${binaryId}`, {
          responseType: 'arraybuffer'
        })
      }));
    }

    isCompatiblieVersion(widget: WidgetModel) {
      return semver.satisfies(this.C8Y_VERSION, widget.requiredPlatformVersion);
    }

    isLatestVersionAvailable(widget: WidgetModel) {
      return semver.lt(widget.installedVersion, widget.version);
    }
}
