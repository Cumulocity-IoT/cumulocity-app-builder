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

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, Renderer2 } from "@angular/core";
import { ApplicationService, InventoryService, IApplication, UserService } from "@c8y/client";
import { Observable, from, Subject, Subscription, BehaviorSubject, combineLatest } from "rxjs";
import { debounceTime, first, map, switchMap, tap } from "rxjs/operators";
import { AppBuilderNavigationService } from "../navigation/app-builder-navigation.service";
import { AlertService, AppStateService } from "@c8y/ngx-components";
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
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AppDataService } from "../app-data.service";
import { Clipboard } from '@angular/cdk/clipboard';

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
    children?: DashboardHierarchyModal,
    isDashboard?: boolean;
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
    showAddDashboard: boolean = true;
    private globalRoles = [];

    filterValue = '';
    filterValueForTree = '';

    app: Observable<any>;
    refreshApp = new BehaviorSubject<void>(undefined);;

    delayedAppUpdateSubject = new Subject<any>();
    delayedAppUpdateSubscription: Subscription;
    appSubscription: Subscription;

    bsModalRef: BsModalRef;
    applyTheme = false;
    autoLockDashboard = true;
    filteredDashboardList: any[];
    currentDashboardId: any;
    dashboardId: any;
    dashboardHierarchy = { id: {}, children: {}, node: {} } as any;
    defaultListView = '2';
    newDashboards = [];
    appBuilderObject: any;
    expandAllDashboards: boolean = true;
    forceUpdate = false;
    expandEventSubject: Subject<void> = new Subject<void>();
    isFilterActive: boolean = false;

    constructor(
        private appIdService: AppIdService, private appService: ApplicationService, private appStateService: AppStateService,
        private brandingService: BrandingService, private inventoryService: InventoryService, private navigation: AppBuilderNavigationService,
        private modalService: BsModalService, private alertService: AlertService, private settingsService: SettingsService,
        private accessRightsService: AccessRightsService, private userService: UserService, private appDataService: AppDataService,
        @Inject(DOCUMENT) private document: Document, private renderer: Renderer2, private cd: ChangeDetectorRef, private clipboard: Clipboard
    ) {
        this.app = combineLatest([appIdService.appIdDelayedUntilAfterLogin$, this.refreshApp]).pipe(
            map(([appId]) => appId),
            switchMap(appId => from(
                this.appDataService.getAppDetails(appId)
            )),
            tap((app: IApplication & { applicationBuilder: any }) => { // TODO: do this a nicer way....
                this.newAppName = app.name;
                this.newAppContextPath = app.contextPath;
                this.newAppIcon = app.applicationBuilder.icon;
            })
        );

        this.delayedAppUpdateSubscription = this.delayedAppUpdateSubject
            .pipe(debounceTime(1000))
            .subscribe(async app => {
                if (this.forceUpdate) {
                    this.appDataService.forceUpdate = true;
                }
                await this.appService.update(app);
                this.refreshApp.next();
                this.navigation.refresh();
                // TODO?
                //this.tabs.refresh();
            });
    }

    async ngOnInit() {
        this.defaultListView = '2';
        let count = 0;
        this.appSubscription = this.app.pipe(first()).
            subscribe(app => {
                if (app.applicationBuilder.branding.enabled && (app.applicationBuilder.selectedTheme && app.applicationBuilder.selectedTheme !== 'Default')) {
                    this.applyTheme = true;
                    this.renderer.addClass(this.document.body, 'dashboard-body-theme');
                } else {
                    this.applyTheme = false;
                }
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
                } else {
                    this.autoLockDashboard = false;
                }
                this.filteredDashboardList = [...app.applicationBuilder.dashboards];
                this.prepareDashboardHierarchy(app);
                this.forceUpdate = true;
            });
        this.isDashboardCatalogEnabled = await this.settingsService.isDashboardCatalogEnabled();
        if (this.userService.hasAllRoles(this.appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN", "ROLE_APPLICATION_MANAGEMENT_ADMIN"])) {
            this.showAddDashboard = true;
        } else {
            this.showAddDashboard = false;
        }
        this.globalRoles = await this.accessRightsService.getAllGlobalRoles();
    }

    private prepareDashboardHierarchy(app: any) {
        this.appBuilderObject = app;
        this.dashboardHierarchy = { id: '-1', children: {}, node: [] };
        app.applicationBuilder.dashboards.forEach(async (element, index) => {
            const path = element.name.split('/').filter(pathSegment => pathSegment != '');
            const currentHierarchyNode = path.reduce((parent, segment, j) => {
                if (!parent.children[segment] || (j == path.length - 1)) {
                    const navNode: DashboardHierarchyModal = {
                        dashboard: element,
                        title: segment,
                        isDashboard: (path[path.length - 1] === segment)
                    };
                    if (parent.children[segment]) {
                        parent.children[segment] = {
                            ...parent.children[segment],
                            ...navNode
                        }
                    } else {
                        parent.children[segment] = {
                            id: (index++).toString(),
                            children: {},
                            ...navNode
                        };
                    }
                }
                return parent.children[segment];
            }, this.dashboardHierarchy);
        });
        this.dashboardHierarchy.children = Object.values(this.dashboardHierarchy.children);
        this.dashboardHierarchy.children = this.convertToArray(this.dashboardHierarchy.children);
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
                    dashboards = [...application.applicationBuilder.dashboards];
                    dashboards.forEach((element, index) => {
                        if (element.id === dashboardIDToDelete) {
                            dashboards.splice(index, 1);
                            application.applicationBuilder.dashboards = [...dashboards];
                        }
                    });
                } else {
                    dashboards.splice(i, 1);
                    application.applicationBuilder.dashboards = [...dashboards];
                }
                this.filteredDashboardList = application.applicationBuilder.dashboards;
                this.prepareDashboardHierarchy(application);
                this.delayedAppUpdateSubject.next({
                    id: application.id,
                    applicationBuilder: application.applicationBuilder
                } as any);

                if (application.applicationBuilder.dashboards.length === 0) {
                    this.autoLockDashboard = false;
                }
                this.cd.detectChanges();
                // TODO?
                // this.tabs.refresh();
            }
        });
    }

    async reorderDashboards(app, newDashboardsOrder) {
        if (!this.isFilterActive) {
            if (newDashboardsOrder.length !== 0) {
                app.applicationBuilder.dashboards = newDashboardsOrder;
                this.delayedAppUpdateSubject.next({
                    id: app.id,
                    applicationBuilder: app.applicationBuilder
                });
            }
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

    async showCreateDashboardDialog(app) {
        let latestApp = await (await this.appService.detail(app.id)).data;
        this.bsModalRef = this.modalService.show(NewDashboardModalComponent, { class: 'c8y-wizard', initialState: { app: latestApp, globalRoles: this.globalRoles } });
        this.bsModalRef.content.onSave.subscribe((isReloadRequired: boolean) => {
            if (isReloadRequired) {
                let count = 0;
                this.autoLockDashboard = true;
                this.refreshApp.next();
                this.prepareDashboardHierarchy(this.bsModalRef.content.app);
                this.filteredDashboardList = [...this.bsModalRef.content.app.applicationBuilder.dashboards];
                this.bsModalRef.content.app.applicationBuilder.dashboards.forEach(async (element) => {
                    let c8y_dashboard = (await this.inventoryService.detail(element.id)).data;
                    if (c8y_dashboard.c8y_Dashboard.isFrozen === false) {
                        count++;
                        if (count > 0) {
                            this.autoLockDashboard = false;
                        }
                    }
                });
                this.cd.detectChanges();
            }
        });
    }

    showEditDashboardDialog(app, dashboards: DashboardConfig[], index: number) {
        // TODO differentiate betwenn template dashboard and normal dashboards

        const dashboard = dashboards[index];
        if (dashboard.templateDashboard) {
            this.showTemplateDashboardEditModalDialog(app, dashboard, index);
        } else {
            let dashboardIDToEdit = dashboard.id;
            dashboards = [...app.applicationBuilder.dashboards];
            dashboards.forEach((element, i) => {
                if (element.id === dashboardIDToEdit) {
                    index = i;
                }
            });
            this.bsModalRef = this.modalService.show(EditDashboardModalComponent, {
                class: 'c8y-wizard',
                initialState: {
                    app,
                    globalRoles: this.globalRoles,
                    index,
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
                    this.cd.detectChanges();
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
        this.appSubscription.unsubscribe();
    }

    searchDashboard(app) {
        this.isFilterActive = true;
        if (this.filterValue) {
            this.filteredDashboardList = [...app.applicationBuilder.dashboards];
            this.filteredDashboardList = this.filteredDashboardList.filter(x => {
                return (x.id && x.id.includes(this.filterValue)) ||
                    (x.name && x.name.toLowerCase().includes(this.filterValue.toLowerCase())) ||
                    (x.icon && x.icon.toLowerCase().includes(this.filterValue.toLowerCase())) ||
                    (x.tabGroup && x.tabGroup.toLowerCase().includes(this.filterValue.toLowerCase())) ||
                    (x.visibility && x.visibility.toLowerCase().includes(this.filterValue.toLowerCase())) ||
                    (x.deviceId && x.deviceId.toLowerCase().includes(this.filterValue.toLowerCase())) ||
                    (x.roles && x.roles.forEach(role => {
                        role.name.toLowerCase().includes(this.filterValue.toLowerCase())
                    }));
            });
        } else {
            this.filteredDashboardList = [...app.applicationBuilder.dashboards];
            this.isFilterActive = false;
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
        return text.toLowerCase().includes(this.filterValueForTree.toLowerCase());
    }

    search(dashboards) {
        return dashboards.reduce((res, node) => {
            if ((node.dashboard.id && this.contains(node.dashboard.id)) || (node.dashboard.name && this.contains(node.dashboard.name)) || (node.dashboard.icon && this.contains(node.dashboard.icon)) || (node.dashboard.tabGroup && this.contains(node.dashboard.tabGroup)) || (node.dashboard.visibility && this.contains(node.dashboard.visibility))
                || (node.dashboard.deviceId && this.contains(node.dashboard.deviceId)) || (node.dashboard.roles && node.dashboard.roles.forEach(role => {
                    (role.name && this.contains(role.name))
                }))) {
                res.push(node);
            } else if (node.children && node.children.length > 0) {
                let arr = this.search(node.children);
                if (arr.length > 0)
                    res.push({ children: arr, id: node.id, dashboard: node.dashboard, title: node.title });
            }
            return res;
        }, []);
    }

    lockAllDashboards(app, checked) {
        this.autoLockDashboard = checked;
        if (this.autoLockDashboard) {
            const alertMessage = {
                title: 'Lock All Dashboards',
                description: `You are about to lock all the dashboards. Do you want to proceed?`,
                type: 'warning',
                alertType: 'confirm', //info|confirm
                confirmPrimary: true //confirm Button is primary
            }
            const autoLockDialogRef = this.alertModalDialog(alertMessage);
            autoLockDialogRef.content.event.subscribe(async data => {
                if (data && data.isConfirm) {
                    app.applicationBuilder.dashboards.forEach(async element => {
                        let dashboard = (await this.inventoryService.detail(element.id)).data;
                        let c8y_Dashboard = dashboard.c8y_Dashboard
                        c8y_Dashboard.isFrozen = true;
                        let dashboardObject = {
                            c8y_Dashboard,
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
                title: 'Unlock All Dashboards',
                description: `You are about to unlock all the dashboards. Do you want to proceed?`,
                type: 'warning',
                alertType: 'confirm', //info|confirm
                confirmPrimary: true //confirm Button is primary
            }
            const autoLockDialogRef = this.alertModalDialog(alertMessage);
            autoLockDialogRef.content.event.subscribe(async data => {
                if (data && data.isConfirm) {
                    app.applicationBuilder.dashboards.forEach(async element => {
                        let dashboard = (await this.inventoryService.detail(element.id)).data;
                        let c8y_Dashboard = dashboard?.c8y_Dashboard
                        c8y_Dashboard.isFrozen = false;
                        let dashboardObject = {
                            c8y_Dashboard,
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
        this.defaultListView = value;
        if (this.defaultListView === '1') {
            this.prepareDashboardHierarchy(app);
        }
    }

    updateDashboardStructure() {
        let dbs = this.setDBName(this.dashboardHierarchy.children);
        this.newDashboards = [];
        this.getAllDashboards(dbs);
        this.appBuilderObject.applicationBuilder.dashboards = [...this.newDashboards];
        this.delayedAppUpdateSubject.next({
            id: this.appBuilderObject.id,
            applicationBuilder: this.appBuilderObject.applicationBuilder
        });
        this.prepareDashboardHierarchy(this.appBuilderObject);
        this.filteredDashboardList = [...this.appBuilderObject.applicationBuilder.dashboards];
        this.navigation.refresh();
    }

    setDBName(dashboards) {
        if (dashboards.length > 0) {
            for (let db of dashboards) {
                if (db.isDashboard) {
                    db.dashboard.name = db.title;
                }
                if (db.children.length > 0) {
                    this.setChildDBName(db);
                }
            }
        }
        return dashboards;
    }

    setChildDBName(dashboard) {
        for (let childDB of dashboard.children) {
            if (dashboard.isDashboard) {
                childDB.dashboard.name = dashboard.title + '/' + childDB.title;
                childDB.title = childDB.dashboard.name;
            } else if (!dashboard.isDashboard && childDB.isDashboard) {
                childDB.dashboard.name = dashboard.title + '/' + childDB.title;
                childDB.title = childDB.dashboard.name;
            } else if (!dashboard.isDashboard && !childDB.isDashboard && childDB.children.length > 0) {
                childDB.dashboard.name = dashboard.title + '/' + childDB.title;
                childDB.title = childDB.dashboard.name;
            }
            if (childDB.children.length > 0) {
                this.setChildDBName(childDB);
            }
        }
        return dashboard;
    }

    editDashboardClicked(dashboard) {
        let index = -1;
        this.newDashboards = [];
        this.getAllDashboards(this.dashboardHierarchy.children);
        index = this.newDashboards.findIndex(db => db.id === dashboard.id);
        if (dashboard.templateDashboard) {
            this.showTemplateDashboardEditModalDialog(this.appBuilderObject, dashboard, index);
        } else {
            this.bsModalRef = this.modalService.show(EditDashboardModalComponent, {
                class: 'c8y-wizard',
                initialState: {
                    app: this.appBuilderObject,
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
        }
        this.bsModalRef.content.onSave.subscribe((isReloadRequired: boolean) => {
            if (isReloadRequired) {
                this.prepareDashboardHierarchy(this.bsModalRef.content.app);
                this.filteredDashboardList = [...this.bsModalRef.content.app.applicationBuilder.dashboards];
                this.cd.detectChanges();
            }
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
                this.appBuilderObject.applicationBuilder.dashboards = [...this.newDashboards];
                this.prepareDashboardHierarchy(this.appBuilderObject);
                this.filteredDashboardList = [...this.newDashboards];
                this.delayedAppUpdateSubject.next({
                    id: this.appBuilderObject.id,
                    applicationBuilder: this.appBuilderObject.applicationBuilder
                } as any);
                if (this.appBuilderObject.applicationBuilder.dashboards.length === 0) {
                    this.autoLockDashboard = false;
                }
                this.cd.detectChanges();
                // TODO?
                // this.tabs.refresh();
            }
        });
    }

    getAllDashboards(dashboards: any) {
        dashboards.forEach((db: any) => {
            if (db.children.length === 0) {
                if (db.isDashboard) {
                    this.newDashboards.push(db.dashboard);
                }
            }
            if (db.children.length > 0) {
                if (db.isDashboard) {
                    this.newDashboards.push(db.dashboard);
                }
                db.children.forEach((childDB: any) => {
                    if (childDB.isDashboard) {
                        this.newDashboards.push(childDB.dashboard);
                    }
                    this.getAllDashboards(childDB.children);
                });
            }
        });
    }

    public get connectedTo(): string[] {
        return this.getIdsRecursive(this.dashboardHierarchy).reverse();
    }

    private getIdsRecursive(node: any): string[] {
        let ids = [node.id];
        if (node.children.length > 0) {
            node.children.forEach(childnode => {
                ids = ids.concat(this.getIdsRecursive(childnode));
            });
        }
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

    expandAllNodes() {
        this.expandAllDashboards = !this.expandAllDashboards;
        this.expandEventSubject.next();
    }

    copyDashboardID(dashboardId: string) {
        this.clipboard.copy(dashboardId);
    }

    getTableTheme() {
        if(this.applyTheme) {
            return 'applyDark';
        } else {
            return 'applyLight';
        }
    }
}
