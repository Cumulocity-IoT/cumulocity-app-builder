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

import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, Renderer2 } from "@angular/core";
import { ApplicationService, InventoryService, IApplication, IManagedObject } from "@c8y/client";
import { Observable, from, Subject, Subscription } from "rxjs";
import { debounceTime, filter, map, switchMap, tap } from "rxjs/operators";
import { AppBuilderNavigationService } from "../navigation/app-builder-navigation.service";
import { AlertService, AppStateService, NavigatorNode } from "@c8y/ngx-components";
import { BrandingService } from "../branding/branding.service";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { NewDashboardModalComponent } from "./new-dashboard-modal.component";
import { EditDashboardModalComponent } from "./edit-dashboard-modal.component";
import { AppIdService } from "../app-id.service";
import { UpdateableAlert } from "../utils/UpdateableAlert";
import { contextPathFromURL } from "../utils/contextPathFromURL";
import * as delay from "delay";
import { TemplateCatalogModalComponent } from "../template-catalog/template-catalog.component";
import { TemplateUpdateModalComponent } from "../template-catalog/template-update.component";
import { BinaryDescription, DeviceDescription } from "../template-catalog/template-catalog.model";
import { SettingsService } from './../../builder/settings/settings.service';
import { AlertMessageModalComponent } from "./../../builder/utils/alert-message-modal/alert-message-modal.component";
import { AccessRightsService } from "./../../builder/access-rights.service";
import { DOCUMENT } from "@angular/common";
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

export interface DashboardConfig {
    id: string,
    name: string,
    visibility?: '' | 'hidden' | 'no-nav',
    tabGroup: string,
    icon: string,
    deviceId?: string,
    roles?: any,
    groupTemplate: {
        groupId: string
    },
    templateDashboard?: {
        id: string;
        name: string;
        devices?: Array<DeviceDescription>,
        binaries?: Array<BinaryDescription>,
        staticBinaries?: Array<BinaryDescription>
    }
}

export interface DashboardHierarchyModal {
    dashboard?: DashboardConfig,
    title?: string,
    children?: DashboardHierarchyModal
}

@Component({
    templateUrl: './dashboard-config.component.html',
    styleUrls: ['./dashboard-config.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardConfigComponent implements OnInit, OnDestroy {
    newAppName: string;
    newAppContextPath: string;
    newAppIcon: string;
    isDashboardCatalogEnabled: boolean = true;
    private globalRoles = [];

    filterValue = '';
    filterValueForTree = '';

    app: Observable<any>;

    delayedAppUpdateSubject = new Subject<any>();
    delayedAppUpdateSubscription: Subscription;

    bsModalRef: BsModalRef;
    applyTheme = false;
    autoLockDashboard = true;
    filteredDashboardList: any[];
    newDashboardsOrder: any[];
    currentDashboardId: any;
    dashboardId: any;
    appBuilderDashboards: any[];
    dashboardHierarchy = { id: {}, children: {}, node: {} } as any;
    defaultListView = '1';
    newDashboards = [];

    constructor(
        private appIdService: AppIdService, private appService: ApplicationService, private appStateService: AppStateService,
        private brandingService: BrandingService, private inventoryService: InventoryService, private navigation: AppBuilderNavigationService,
        private modalService: BsModalService, private alertService: AlertService, private settingsService: SettingsService,
        private accessRightsService: AccessRightsService,
        @Inject(DOCUMENT) private document: Document, private renderer: Renderer2, private cd: ChangeDetectorRef
    ) {
        this.app = this.appIdService.appIdDelayedUntilAfterLogin$.pipe(
            switchMap(appId => from(
                appService.detail(appId).then(res => res.data as any)
            )),
            tap((app: IApplication & { applicationBuilder: any }) => { // TODO: do this a nicer way....
                this.newAppName = app.name;
                this.newAppContextPath = app.contextPath;
                this.newAppIcon = app.applicationBuilder.icon;
            })
        );

        this.delayedAppUpdateSubscription = this.delayedAppUpdateSubject
            .pipe(debounceTime(500))
            .subscribe(async app => {
                await this.appService.update(app);
                //await this.prepareDashboardHierarchy(app);
                this.navigation.refresh();
                // TODO?
                //this.tabs.refresh();
            });
        this.app.subscribe((app) => {
            if (app.applicationBuilder.branding.enabled && (app.applicationBuilder.selectedTheme && app.applicationBuilder.selectedTheme !== 'Default')) {
                this.applyTheme = true;
                this.renderer.addClass(this.document.body, 'dashboard-body-theme');
            } else {
                this.applyTheme = false;
            }
        });
    }

    async ngOnInit() {
        this.defaultListView = '1';
        let count = 0;
        this.app.subscribe(app => {
            if (app.applicationBuilder.dashboards.length !== 0) {
                app.applicationBuilder.dashboards.forEach(async (element) => {
                    let c8y_dashboard = (await this.inventoryService.detail(element.id)).data;
                    if (c8y_dashboard.c8y_Dashboard.isFrozen === false) {
                        count++;
                        if (count > 0) {
                            this.autoLockDashboard = false;
                        }
                    }
                });
                if (this.defaultListView === '1') {
                    this.prepareDashboardHierarchy(app);
                }
            } else {
                this.autoLockDashboard = false;
            }
            this.filteredDashboardList = app.applicationBuilder.dashboards;
        });

        this.isDashboardCatalogEnabled = await this.settingsService.isDashboardCatalogEnabled();
        this.globalRoles = await this.accessRightsService.getAllGlobalRoles();
    }

    private prepareDashboardHierarchy(app: any) {
        this.dashboardHierarchy = { id: '-1', children: {}, node: [] };
        app.applicationBuilder.dashboards.forEach(async (element, index) => {
            const path = element.name.split('/').filter(pathSegment => pathSegment != '');
            const currentHierarchyNode = path.reduce((parent, segment, j) => {
                if (!parent.children[segment] || (j == path.length - 1)) {
                    const navNode: DashboardHierarchyModal = {
                        dashboard: element,
                        title: segment
                    };
                    parent.children[segment] = {
                        id: (index++).toString(),
                        children: {},
                        ...navNode
                    };
                }
                return parent.children[segment];
            }, this.dashboardHierarchy);
        });
        this.dashboardHierarchy.children = Object.values(this.dashboardHierarchy.children);
        this.dashboardHierarchy.children = this.convertToArray(this.dashboardHierarchy.children);
        this.cd.detectChanges();
    }

    convertToArray(dashboards) {
        dashboards.forEach((db: any) => {
            if (db.children) {
                db.children = Object.values(db.children);
                this.convertToArray(db.children);
            }
        });
        return dashboards;
    }

    private alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }
    async deleteDashboard(application, dashboards: DashboardConfig[], i: number) {
        const alertMessage = {
            title: 'Delete Dashboard',
            description: `You are about to delete this dashboard. This operation is irreversible. Do you want to proceed?`,
            type: 'danger',
            alertType: 'confirm', //info|confirm,
            confirmPrimary: true //confirm Button is primary
        }
        const installDemoDialogRef = this.alertModalDialog(alertMessage);
        await installDemoDialogRef.content.event.subscribe(async data => {
            if (data && data.isConfirm) {
                if (this.filteredDashboardList.length !== application.applicationBuilder.dashboards.length) {
                    let dashboardIDToDelete;
                    this.filteredDashboardList.forEach((element, index) => {
                        if (index === i) {
                            dashboardIDToDelete = element.id;
                        }
                    });
                    this.filteredDashboardList.splice(i, 1);
                    dashboards = [...application.applicationBuilder.dashboards];
                    dashboards.forEach((element, index) => {
                        if (element.id === dashboardIDToDelete) {
                            dashboards.splice(index, 1);
                            application.applicationBuilder.dashboards = [...dashboards];
                        }
                    });
                } else {
                    dashboards.splice(i, 1);
                    this.filteredDashboardList.splice(i, 1);
                    application.applicationBuilder.dashboards = [...dashboards];
                }
                await this.appService.update({
                    id: application.id,
                    applicationBuilder: application.applicationBuilder
                } as any);
                this.filteredDashboardList = [...application.applicationBuilder.dashboards];
                this.prepareDashboardHierarchy(application);
                if (application.applicationBuilder.dashboards.length === 0) {
                    this.autoLockDashboard = false;
                }
                this.navigation.refresh();
                // TODO?
                // this.tabs.refresh();
            }
        });
    }

    async reorderDashboards(app, newDashboardsOrder) {
        this.newDashboardsOrder = newDashboardsOrder;
        this.appBuilderDashboards = app.applicationBuilder.dashboards;
        if (newDashboardsOrder.length === app.applicationBuilder.dashboards.length) {
            app.applicationBuilder.dashboards = newDashboardsOrder;
            this.delayedAppUpdateSubject.next({
                id: app.id,
                applicationBuilder: app.applicationBuilder
            });
            this.prepareDashboardHierarchy(app);
        }
    }


    async saveAppChanges(app) {
        const savingAlert = new UpdateableAlert(this.alertService);

        savingAlert.update('Saving application...');

        try {
            app.name = this.newAppName;
            app.applicationBuilder.icon = this.newAppIcon;
            app.icon = {
                name: this.newAppIcon,
                "class": `fa fa-${this.newAppIcon}`
            };

            const update: any = {
                id: app.id,
                name: app.name,
                key: `application-builder-${app.name}-app-key`,
                applicationBuilder: app.applicationBuilder,
                icon: app.icon
            };

            if (app.manifest) {
                app.manifest.icon = app.icon;
                update.manifest = app.manifest;
            }

            let contextPathUpdated = false;
            const currentAppContextPath = app.contextPath;
            if (app.contextPath && app.contextPath != this.newAppContextPath) {
                app.contextPath = this.newAppContextPath;
                update.contextPath = this.newAppContextPath;
                contextPathUpdated = true;
            }

            await this.appService.update(update);

            if (contextPathUpdated && contextPathFromURL() === currentAppContextPath) {
                savingAlert.update('Saving application...\nWaiting for redeploy...');
                // Pause while c8y server reloads the application
                await delay(5000);
                window.location = `/apps/${this.newAppContextPath}/${window.location.hash}` as any;
            }

            savingAlert.update('Application saved!', 'success');
            savingAlert.close(1500);
        } catch (e) {
            savingAlert.update('Unable to save!\nCheck browser console for details', 'danger');
            throw e;
        }

        // Refresh the application name/icon
        this.brandingService.updateStyleForApp(app);
        // Refresh the applications list
        this.appStateService.currentUser.next(this.appStateService.currentUser.value);
    }

    showCreateDashboardDialog(app) {
        this.bsModalRef = this.modalService.show(NewDashboardModalComponent, { class: 'c8y-wizard', initialState: { app, globalRoles: this.globalRoles } });
        this.bsModalRef.content.onSave.subscribe((isReloadRequired: boolean) => {
            if (isReloadRequired) {
                let count = 0;
                this.app.subscribe((app) => {
                    this.autoLockDashboard = true;
                    //this.filteredDashboardList = [...app.applicationBuilder.dashboards];
                    app.applicationBuilder.dashboards.forEach(async (element) => {
                        let c8y_dashboard = (await this.inventoryService.detail(element.id)).data;
                        if (c8y_dashboard.c8y_Dashboard.isFrozen === false) {
                            count++;
                            if (count > 0) {
                                this.autoLockDashboard = false;
                            }
                        }
                    });
                    this.prepareDashboardHierarchy(app);
                    this.filteredDashboardList = [...app.applicationBuilder.dashboards];
                    this.cd.detectChanges();
                });
            }
        });
    }

    showEditDashboardDialog(app, dashboards: DashboardConfig[], index: number) {
        // TODO differentiate betwenn template dashboard and normal dashboards

        const dashboard = dashboards[index];
        if (dashboard.templateDashboard) {
            this.showTemplateDashboardEditModalDialog(app, dashboard, index);
        } else {
            if (this.filterValue !== '') {
                let dashboardIDToEdit = dashboard.id;
                dashboards = [...app.applicationBuilder.dashboards];
                dashboards.forEach((element, i) => {
                    if (element.id === dashboardIDToEdit) {
                        index = i;
                    }
                });
            }
            this.bsModalRef = this.modalService.show(EditDashboardModalComponent, {
                class: 'c8y-wizard',
                initialState: {
                    app,
                    globalRoles: this.globalRoles,
                    index,
                    dashboardName: dashboard.name,
                    dashboardVisibility: dashboard.visibility || '',
                    dashboardIcon: dashboard.icon,
                    deviceId: dashboard.deviceId,
                    tabGroup: dashboard.tabGroup,
                    roles: dashboard.roles,
                    ...(dashboard.groupTemplate ? {
                        dashboardType: 'group-template'
                    } : {
                        dashboardType: 'standard'
                    })
                }
            });
            this.bsModalRef.content.onSave.subscribe((isReloadRequired: boolean) => {
                if (isReloadRequired) {
                    this.prepareDashboardHierarchy(this.bsModalRef.content.app);
                    this.filteredDashboardList = [...this.bsModalRef.content.app.applicationBuilder.dashboards];
                }
            });
        }
    }

    showTemplateCatalogModalDialog(app): void {
        this.bsModalRef = this.modalService.show(TemplateCatalogModalComponent, { backdrop: 'static', class: 'modal-lg', initialState: { app } });
        this.bsModalRef.content.onSave.subscribe((isReloadRequired: boolean) => {
            if (isReloadRequired) {
                location.reload();
                if (this.defaultListView === '1') {
                    this.prepareDashboardHierarchy(app);
                }
            }
        });
    }

    showTemplateDashboardEditModalDialog(app, dashboardConfig: DashboardConfig, index: number): void {
        this.bsModalRef = this.modalService.show(TemplateUpdateModalComponent, { backdrop: 'static', class: 'modal-lg', initialState: { app, dashboardConfig, index, globalRoles: this.globalRoles } });
    }

    ngOnDestroy(): void {
        this.renderer.removeClass(this.document.body, 'dashboard-body-theme');
        this.delayedAppUpdateSubscription.unsubscribe();
    }

    searchDashboard(app) {
        if (this.filterValue) {
            this.filteredDashboardList = [...app.applicationBuilder.dashboards];
            this.filteredDashboardList = this.filteredDashboardList.filter(x => {
                return x.id.includes(this.filterValue) ||
                    x.name.toLowerCase().includes(this.filterValue.toLowerCase()) ||
                    x.icon.toLowerCase().includes(this.filterValue.toLowerCase()) ||
                    x.tabGroup.toLowerCase().includes(this.filterValue.toLowerCase()) ||
                    x.visibility.toLowerCase().includes(this.filterValue.toLowerCase()) ||
                    (x.roles && x.roles.forEach(role => {
                        role.name.toLowerCase().includes(this.filterValue.toLowerCase())
                    }));
            });
        } else {
            this.filteredDashboardList = [...app.applicationBuilder.dashboards];
        }
    }

    searchInTreeDashboard(app) {
        if (this.filterValueForTree) {
            this.dashboardHierarchy.children = this.search(this.dashboardHierarchy.children);
        } else {
            this.prepareDashboardHierarchy(app);
        }
    }
    contains(text: string): boolean {
        return text.toLowerCase().indexOf(this.filterValueForTree.toLowerCase()) >= 0;
    }

    search(dashboards) {
        return dashboards.reduce((res, node) => {
            if (this.contains(node.dashboard.id) || this.contains(node.dashboard.name) || this.contains(node.dashboard.icon) || this.contains(node.dashboard.tabGroup) || this.contains(node.dashboard.visibility)) {
                res.push(node);
            } else if (node.children && node.children.length > 0) {
                let arr = this.search(node.children);
                if (arr.length > 0)
                    res.push({children: arr, id: node.id, dashboard: node.dashboard});
            }
            return res;
        }, []);
    }

    lockAllDashboards(app, checked) {
        this.autoLockDashboard = checked;
        if (this.autoLockDashboard) {
            const alertMessage = {
                title: 'Lock Dashboard',
                description: `You are about to lock all the dashboards. Do you want to proceed?`,
                type: 'warning',
                alertType: 'confirm', //info|confirm
                confirmPrimary: true //confirm Button is primary
            }
            const autoLockDialogRef = this.alertModalDialog(alertMessage);
            autoLockDialogRef.content.event.subscribe(async data => {
                if (data && data.isConfirm) {
                    app.applicationBuilder.dashboards.forEach(async element => {
                        let c8y_dashboard = (await this.inventoryService.detail(element.id)).data;
                        let dashboardObject = {
                            c8y_Dashboard: {
                                children: c8y_dashboard.c8y_Dashboard.children,
                                isFrozen: true
                            },
                            id: element.id
                        };
                        this.inventoryService.update(dashboardObject);
                    });
                } else {
                    this.autoLockDashboard = !checked;
                }
            });

        } else {
            const alertMessage = {
                title: 'Unlock Dashboard',
                description: `You are about to unlock all the dashboards. Do you want to proceed?`,
                type: 'warning',
                alertType: 'confirm', //info|confirm
                confirmPrimary: true //confirm Button is primary
            }
            const autoLockDialogRef = this.alertModalDialog(alertMessage);
            autoLockDialogRef.content.event.subscribe(async data => {
                if (data && data.isConfirm) {
                    app.applicationBuilder.dashboards.forEach(async element => {
                        let c8y_dashboard = (await this.inventoryService.detail(element.id)).data;
                        let dashboardObject = {
                            c8y_Dashboard: {
                                children: c8y_dashboard.c8y_Dashboard.children,
                                isFrozen: false
                            },
                            id: element.id
                        };
                        this.inventoryService.update(dashboardObject);
                    });
                } else {
                    this.autoLockDashboard = !checked;
                }
            });
        }

    }

    // Tree List View
    displayList(value, app) {
        this.cd.detectChanges();
        this.defaultListView = value;
    }

    updateDashboardStructure() {
        let dashboards = {} as any;
        dashboards = this.setDBName(this.dashboardHierarchy.children);
        this.newDashboards = [];
        this.getAllDashboards(dashboards);
        this.app.subscribe((app) => {
            app.applicationBuilder.dashboards = [...this.newDashboards];
            this.delayedAppUpdateSubject.next({
                id: app.id,
                applicationBuilder: app.applicationBuilder
            });
        });
        this.cd.detectChanges();
    }

    setDBName(dashboards) {
        dashboards.forEach((db: any) => {
            if (db.children.length > 0) {
                db.children.forEach((childDB: any) => {
                    childDB.dashboard.name = db.dashboard.name + '/' + childDB.title;
                    if (childDB.children.length > 0) {
                        childDB.children.forEach((subchildDB: any) => {
                            subchildDB.dashboard.name = childDB.dashboard.name + '/' + subchildDB.title;
                            this.setDBName(subchildDB.children);
                        });
                    }
                });
            }
        });
        return dashboards;
    }

    editDashboardClicked(dashboard) {
        let index = -1;
        this.newDashboards = [];
        this.getAllDashboards(this.dashboardHierarchy.children);
        index = this.newDashboards.findIndex(db => db.id === dashboard.id);
        this.app.subscribe((app) => {
            if (dashboard.templateDashboard) {
                this.showTemplateDashboardEditModalDialog(app, dashboard, index);
            }
            this.bsModalRef = this.modalService.show(EditDashboardModalComponent, {
                class: 'c8y-wizard',
                initialState: {
                    app,
                    globalRoles: this.globalRoles,
                    dashboardID: dashboard.id,
                    dashboardName: dashboard.name,
                    dashboardVisibility: dashboard.visibility || '',
                    dashboardIcon: dashboard.icon,
                    deviceId: dashboard.deviceId,
                    tabGroup: dashboard.tabGroup,
                    roles: dashboard.roles,
                    ...(dashboard.groupTemplate ? {
                        dashboardType: 'group-template'
                    } : {
                        dashboardType: 'standard'
                    })
                }
            });
            this.bsModalRef.content.onSave.subscribe((isReloadRequired: boolean) => {
                if (isReloadRequired) {
                    this.prepareDashboardHierarchy(this.bsModalRef.content.app);
                    this.filteredDashboardList = [...this.bsModalRef.content.app.applicationBuilder.dashboards];
                }
            });
        });
    }

    async deleteDashboardClicked(dashboard) {
        const alertMessage = {
            title: 'Delete Dashboard',
            description: `You are about to delete this dashboard. This operation is irreversible. Do you want to proceed?`,
            type: 'danger',
            alertType: 'confirm', //info|confirm,
            confirmPrimary: true //confirm Button is primary
        }
        const deleteDemoDialogRef = this.alertModalDialog(alertMessage);
        await deleteDemoDialogRef.content.event.subscribe(async data => {
            if (data && data.isConfirm) {
                this.newDashboards = [];
                this.getAllDashboards(this.dashboardHierarchy.children);
                let index = this.newDashboards.findIndex(db => db.id === dashboard.id);
                this.newDashboards.splice(index, 1);
                this.app.subscribe(async (app) => {
                    app.applicationBuilder.dashboards = [...this.newDashboards];
                    await this.appService.update({
                        id: app.id,
                        applicationBuilder: app.applicationBuilder
                    } as any);
                    if (app.applicationBuilder.dashboards.length === 0) {
                        this.autoLockDashboard = false;
                    }
                    this.navigation.refresh();
                    this.prepareDashboardHierarchy(app);
                    this.filteredDashboardList = [...this.newDashboards];
                });
                // TODO?
                // this.tabs.refresh();
            }
        });
    }

    getAllDashboards(dashboards: any) {
        dashboards.forEach((db: any) => {
            this.newDashboards.push(db.dashboard);
            this.getAllDashboards(db.children);
        });
    }

    public get connectedTo(): string[] {
        return this.getIdsRecursive(this.dashboardHierarchy).reverse();
    }

    private getIdsRecursive(node: any): string[] {
        let ids = [node.id];
        node.children.forEach(childnode => {
            ids = ids.concat(this.getIdsRecursive(childnode));
        });
        return ids;
    }

    onDragDrop(event) {
        if (event.previousContainer === event.container) {
            moveItemInArray(
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        }
        this.updateDashboardStructure();
    };
}
