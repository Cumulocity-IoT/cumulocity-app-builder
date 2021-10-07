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

import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { has, get } from "lodash-es";
import { IManagedObject, IManagedObjectBinary } from '@c8y/client';
import { BinaryDescription, CumulocityDashboard, DependencyDescription, DeviceDescription, TemplateCatalogEntry, TemplateDashboardWidget, TemplateDetails } from "./template-catalog.model";
import { ApplicationService, InventoryBinaryService, InventoryService } from "@c8y/ngx-components/api";
import { AppBuilderNavigationService } from "../navigation/app-builder-navigation.service";
import { Alert, AlertService } from "@c8y/ngx-components";
// import { RuntimeWidgetInstallerService } from "cumulocity-runtime-widget-loader";
import { AppBuilderExternalAssetsService } from 'app-builder-external-assets';
import { DashboardConfig } from "builder/application-config/dashboard-config.component";

@Injectable()
export class TemplateCatalogService {

    private GATEWAY_URL = '';
    private CATALOG_LABCASE_ID = '';

    constructor(private http: HttpClient, private inventoryService: InventoryService,
        private appService: ApplicationService, private navigation: AppBuilderNavigationService,
        private binaryService: InventoryBinaryService, private alertService: AlertService,
   //     private runtimeWidgetInstallerService: RuntimeWidgetInstallerService,
        private externalService: AppBuilderExternalAssetsService) {
        this.GATEWAY_URL = this.externalService.getURL('DBCATALOG', 'gatewayURL');
        this.CATALOG_LABCASE_ID = this.externalService.getURL('DBCATALOG', 'labcaseId');
    }

    getTemplateCatalog(): Observable<TemplateCatalogEntry[]> {
        return this.http.get(`${this.GATEWAY_URL}${this.CATALOG_LABCASE_ID}`).pipe(map(response => {
            if (!has(response, 'catalog')) {
                console.error('Failed to load catalog');
                return undefined;
            }

            let catalog = response['catalog'] as Array<object>;
            return catalog.map(entry => {
                return {
                    title: get(entry, 'title'),
                    description: get(entry, 'description'),
                    thumbnail: get(entry, 'thumbnail'),
                    manufactur: get(entry, 'manufactur'),
                    useCase: get(entry, 'use_case'),
                    device: get(entry, 'device'),
                    dashboard: get(entry, 'dashboard'),
                    comingSoon: get(entry, 'coming_soon')
                } as TemplateCatalogEntry;
            });
        }));
    }

    getTemplateDetails(dashboardId: string): Observable<TemplateDetails> {
        return this.http.get(`${this.GATEWAY_URL}${dashboardId}`).pipe(map((dashboard: TemplateDetails) => {
            return dashboard;
        }));
    }

    async installWidget(binary: Blob) {
     //   await this.runtimeWidgetInstallerService.installWidget(binary, (msg, type) => { });
        this.alertService.success("Widget Added! Page will be refreshed once dashbaord is saved...");
    }

    downloadBinary(binaryId: string): Observable<ArrayBuffer> {
        return this.http.get(`${this.GATEWAY_URL}${binaryId}`, {
            responseType: 'arraybuffer'
        });
    }

    uploadImage(image: File): Promise<string> {
        return this.binaryService.create(image).then((response) => {
            let imageBinary = response.data as IManagedObjectBinary
            return imageBinary.id;
        });
    }

    async createDashboard(application, dashboardConfiguration, templateCatalogEntry: TemplateCatalogEntry, templateDetails: TemplateDetails) {
        if (templateDetails.input.devices && templateDetails.input.devices.length > 0) {
            templateDetails.widgets = this.updateWidgetConfigurationWithDeviceInformation(templateDetails.input.devices, templateDetails.widgets);
        }

        if (templateDetails.input.images && templateDetails.input.images.length > 0) {
            templateDetails.widgets = this.updateWidgetConfigurationWithImageInformation(templateDetails.input.images, templateDetails.widgets);
        }

        await this.inventoryService.create({
            "c8y_Dashboard": this.getCumulocityDashboardRepresentation(dashboardConfiguration, templateDetails.widgets)
        }).then(({ data }) => {
            application.applicationBuilder.dashboards = [
                ...application.applicationBuilder.dashboards || [],
                {
                    id: data.id,
                    name: dashboardConfiguration.dashboardName,
                    icon: dashboardConfiguration.dashboardIcon,
                    visibility: dashboardConfiguration.dashboardVisibility,
                    tabGroup: dashboardConfiguration.tabGroup,
                    ...(templateDetails.input.devices && templateDetails.input.devices.length > 0 && templateDetails.input.devices[0].reprensentation &&
                        templateDetails.input.devices[0].reprensentation.id  ? { deviceId: templateDetails.input.devices[0].reprensentation.id } : {}),
                    templateDashboard: {
                        id: templateCatalogEntry.dashboard,
                        name: templateCatalogEntry.title,
                        devices: templateDetails.input.devices ? templateDetails.input.devices : [],
                        binaries: templateDetails.input.images ? templateDetails.input.images : []
                    }
                }
            ];

            return this.appService.update({
                id: application.id,
                applicationBuilder: application.applicationBuilder
            } as any);
        }).then(() => {
            this.navigation.refresh();
        });
    }

    async updateDashboard(application, dashboardConfig: DashboardConfig, templateDetails: TemplateDetails, index: number) {
        if (templateDetails.input.devices && templateDetails.input.devices.length > 0) {
            templateDetails.widgets = this.updateWidgetConfigurationWithDeviceInformation(templateDetails.input.devices, templateDetails.widgets);
        }

        if (templateDetails.input.images && templateDetails.input.images.length > 0) {
            templateDetails.widgets = this.updateWidgetConfigurationWithImageInformation(templateDetails.input.images, templateDetails.widgets);
        }

        const dashboardManagedObject = (await this.inventoryService.detail(dashboardConfig.id)).data;
        await this.inventoryService.update({
            id: dashboardManagedObject.id,
            "c8y_Dashboard": this.getCumulocityDashboardRepresentation(dashboardConfig, templateDetails.widgets)
        });

        const dashboard = application.applicationBuilder.dashboards[index];
        application.applicationBuilder.dashboards[index] = {
            id: dashboardManagedObject.id,
            name: dashboardConfig.name,
            icon: dashboardConfig.icon,
            visibility: dashboardConfig.visibility,
            tabGroup: dashboardConfig.tabGroup,
            ...(templateDetails.input.devices && templateDetails.input.devices.length > 0 && templateDetails.input.devices[0].reprensentation &&
                templateDetails.input.devices[0].reprensentation.id  ? { deviceId: templateDetails.input.devices[0].reprensentation.id } : {}),
            templateDashboard: {
                id: dashboard.templateDashboard.id,
                name: dashboard.templateDashboard.title,
                devices: templateDetails.input.devices ? templateDetails.input.devices : [],
                binaries: templateDetails.input.images ? templateDetails.input.images : []
            }
        };

        await this.appService.update({
            id: application.id,
            applicationBuilder: application.applicationBuilder
        } as any);

        this.navigation.refresh();
    }

    private getCumulocityDashboardRepresentation(dashboardConfiguration, widgets: Array<TemplateDashboardWidget>): CumulocityDashboard {
        return {
            children: this.getWidgetsAsChildren(widgets),
            name: dashboardConfiguration.dashboardName,
            icon: dashboardConfiguration.dashboardIcon,
            global: true,
            isFrozen: true,
        };
    }

    private getWidgetsAsChildren(widgets: Array<TemplateDashboardWidget>): object {
        let children = {};

        widgets.forEach(widget => {
            widget.id = this.generateId();
            children[this.generateId()] = widget;
        })

        return children;
    }

    private updateWidgetConfigurationWithDeviceInformation(devices: Array<DeviceDescription>, widgets: Array<TemplateDashboardWidget>): Array<TemplateDashboardWidget> {
        let updatedWidgets = widgets.map(widget => {
            let widgetStringDescription: any = JSON.stringify(widget);

            devices.forEach(device => {
                widgetStringDescription = widgetStringDescription.replaceAll(`"{{${device.placeholder}.id}}"`, `"${device.reprensentation.id}"`);
                widgetStringDescription = widgetStringDescription.replaceAll(`"{{${device.placeholder}.name}}"`, `"${device.reprensentation.name}"`);
            })

            widget = JSON.parse(widgetStringDescription);
            return widget
        })

        return updatedWidgets;
    }

    private updateWidgetConfigurationWithImageInformation(images: Array<BinaryDescription>, widgets: Array<TemplateDashboardWidget>): Array<TemplateDashboardWidget> {
        let updatedWidgets = widgets.map(widget => {
            let widgetStringDescription: any = JSON.stringify(widget);

            images.forEach(image => {
                widgetStringDescription = widgetStringDescription.replaceAll(`"{{${image.placeholder}.id}}"`, `"${image.id}"`);
            })

            widget = JSON.parse(widgetStringDescription);
            return widget
        })

        return updatedWidgets;
    }

    private generateId(): string {
        let id = this.generateRandomInteger(10000, 100000000);
        return id.toString();
    }

    private generateRandomInteger(min, max): number {
        return Math.floor(Math.random() * Math.floor(max) + min);
    }
}