import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApplicationService, InventoryBinaryService, InventoryService } from '@c8y/client';
import { AlertService } from '@c8y/ngx-components';
import { AppBuilderExternalAssetsService } from 'app-builder-external-assets';
import { RuntimeWidgetInstallerService } from 'cumulocity-runtime-widget-loader';
import { Observable } from 'rxjs';
import { WidgetCatalog } from './widget-catalog.model';

@Injectable()
export class WidgetCatalogService {

    private GATEWAY_URL = '';
    private CATALOG_LABCASE_ID = 'd20d060ed02f84b42e9f759b5fe50b72';
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
        this.GATEWAY_URL = this.externalService.getURL('DBCATALOG', 'gatewayURL');
        // this.CATALOG_LABCASE_ID = this.externalService.getURL('DBCATALOG', 'labcaseId');
    }


    fetchWidgetCatalog(): Observable<WidgetCatalog> {
        return this.http.get<WidgetCatalog>(`${this.GATEWAY_URL}${this.CATALOG_LABCASE_ID}`, this.HTTP_HEADERS);
    }
}
