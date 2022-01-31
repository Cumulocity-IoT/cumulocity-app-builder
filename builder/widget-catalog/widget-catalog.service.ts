import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApplicationService, InventoryBinaryService, InventoryService } from '@c8y/client';
import { AlertService } from '@c8y/ngx-components';
import { AppBuilderExternalAssetsService } from 'app-builder-external-assets';
import { RuntimeWidgetInstallerService } from 'cumulocity-runtime-widget-loader';
import { Observable } from 'rxjs';
import { WidgetCatalog, WidgetModel } from './widget-catalog.model';
import * as semver from "semver";

@Injectable()
export class WidgetCatalogService {

    C8Y_VERSION = '1011.0.5';
    private WidgetCatalogPath = '/widgetCatalog/widget-catalog.json';
    private GATEWAY_URL_GitHubAsset = '';
    private GATEWAY_URL_GitHubAPI = '';
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
        this.GATEWAY_URL_GitHubAPI = this.externalService.getURL('GITHUB','gatewayURL_Github');
        this.GATEWAY_URL_GitHubAsset =  this.externalService.getURL('GITHUB','gatewayURL_GitHubAsset');
    }


    fetchWidgetCatalog(): Observable<WidgetCatalog> {
        return this.http.get<WidgetCatalog>(`${this.GATEWAY_URL_GitHubAPI}${this.WidgetCatalogPath}`, this.HTTP_HEADERS);
    }

    async installWidget(binary: Blob, widget: WidgetModel) {
      await this.runtimeWidgetInstallerService.installWidget(binary, (msg, type) => { }, widget);
    }

    downloadBinary(binaryId: string): Observable<ArrayBuffer> {
      return this.http.get(`${this.GATEWAY_URL_GitHubAsset}${binaryId}`, {
          responseType: 'arraybuffer'
      });
    }

    isCompatiblieVersion(widget: any) {
      if(!widget || !widget.requiredPlatformVersion ) return false;
      return semver.satisfies(this.C8Y_VERSION, widget.requiredPlatformVersion);
    }

    isLatestVersionAvailable(widget: WidgetModel) {
      return semver.lt(widget.installedVersion, widget.version);
    }
}
