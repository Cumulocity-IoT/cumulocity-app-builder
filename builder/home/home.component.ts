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

import {Component, isDevMode, OnInit} from "@angular/core";
import { AppBuilderExternalAssetsService } from 'app-builder-external-assets';
import { AppBuilderUpgradeService } from "../app-builder-upgrade/app-builder-upgrade.service";
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import './cumulocity';
import { VideoModalComponent } from './video-modal.component';
import { UserService } from "@c8y/ngx-components/api";
import { AlertService, AppStateService } from "@c8y/ngx-components";
import { ExternalApp } from "../app-builder-upgrade/app-builder-upgrade.model";
import { Router } from "@angular/router";
import * as semver from "semver";
import * as packageJson from "./../../package.json";

@Component({
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit{

    bsModalRef: BsModalRef;
    mediaList = [];
    userHasAdminRights: boolean;
    pkgVersion: any;

    constructor(private modalService: BsModalService, private externalService: AppBuilderExternalAssetsService,
        private appBuilderUpgradeService: AppBuilderUpgradeService, private alertService: AlertService,
        private userService: UserService, private appStateService: AppStateService, private router: Router) {
            this.userHasAdminRights = userService.hasRole(appStateService.currentUser.value, "ROLE_APPLICATION_MANAGEMENT_ADMIN");
        }

    ngOnInit() {
        this.mediaList = this.externalService.getAssetsList('MEDIA');
        this.pkgVersion = packageJson.version;
    }

    getURL(type) {
        return this.externalService.getURL('HOME', type);
    }
    // Open External Link based or play media
    openLink(type) {
        switch (type) {
            case 'widget':
            case 'source': 
            case 'forum':
                window.open(this.externalService.getURL('HOME', type));
                break;

            case 'media-01':
            case 'media-02':
            case 'media-03':
            case 'media-04':
            case 'media-05':
            case 'media-06':
            case 'media-07':
            case 'media-08':
                const media = this.getMediaDetails(type);
                const currentTime = new Date().getTime();
                const mediaURL = this.externalService.getURL('MEDIA',type) + `?t=${currentTime}`;
                this.bsModalRef = this.modalService.show(VideoModalComponent, 
                    { backdrop: 'static' ,  class: 'c8y-wizard', initialState: { media, mediaURL}} );
                break;

            default:
                break;
        }
    }

    private getMediaDetails(key) {
        return this.mediaList.find(mkey => mkey.key === key);
    }

    async installDemoCatalog() {
        if(this.userHasAdminRights) {
           await this.appBuilderUpgradeService.fetchAppBuilderConfig()
           .subscribe( async appBuilderConfig => {
                if(appBuilderConfig && appBuilderConfig.externalApps && appBuilderConfig.externalApps.length > 0){
                    const demoCatalogApp: ExternalApp = appBuilderConfig.externalApps.find( app => app.appName === 'demo-catalog' && 
                    this.verifyAppBuilderVersion(app.appBuilderVersion));
                    if(demoCatalogApp && demoCatalogApp.binaryLink){
                        const currentHost = window.location.host.split(':')[0];
                        if (currentHost === 'localhost' || currentHost === '127.0.0.1' || isDevMode()) {
                                this.alertService.warning("Installation isn't supported when running Application Builder on localhost or in development mode.");
                                return;
                        }
                        const appList = await this.appBuilderUpgradeService.getApplicationList();
                        const existingDemoCatalogApp = appList.find( app => demoCatalogApp.contextPath && app.contextPath === demoCatalogApp.contextPath);
                        if(existingDemoCatalogApp) {
                           window.location.href = `/apps/${existingDemoCatalogApp.contextPath}`;
                        } else {this.initiateInstallation(demoCatalogApp); }
                        
                    } else {
                        this.alertService.danger("There is some technical error! Please try after sometime.");
                    }
                }
            });
        } else {
             this.alertService.danger("User does not have the required permissions to install Demo Catalog", "Missing Application Admin Permission");
        }
        
    }
    
    private verifyAppBuilderVersion(nextVersion: string) {
        const version =  semver.valid(semver.coerce(this.pkgVersion ));
        return semver.satisfies(version, nextVersion);
    }
    private initiateInstallation(dempCatalogApp: ExternalApp) {
        const alertMessage = {
            title: 'Installation Confirmation',
            description: `You are about to Install Demo Catalog.
            Do you want to proceed?`,
            type: 'info',
            alertType: 'confirm', //info|confirm
            confirmPrimary: true //confirm Button is primary
          }
        const installDemoCatalogDialogRef = this.appBuilderUpgradeService.alertModalDialog(alertMessage);
        installDemoCatalogDialogRef.content.event.subscribe(async data => {
            if (data && data.isConfirm) {
              this.appBuilderUpgradeService.showProgressModalDialog('Installing Demo Catalog...');
              await this.appBuilderUpgradeService.downloadAndInstall(dempCatalogApp.binaryLink, dempCatalogApp.fileName, false, 'INSTALL');
              this.appBuilderUpgradeService.hideProgressModalDialog();
              if(!this.appBuilderUpgradeService.errorReported) {
                const postInstallMsg = {
                    title: 'Installation Completed',
                    description: 'Demo Catalog is successfully installed.',
                    type: 'info',
                    alertType: 'info' //info|confirm
                  };
                  const postInstalaltionDialogRef = this.appBuilderUpgradeService.alertModalDialog(postInstallMsg);
                  await postInstalaltionDialogRef.content.event.subscribe(data => {
                    window.location.reload();
                  });
              }
            }
          });
    }
}