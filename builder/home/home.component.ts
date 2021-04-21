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

import {Component, OnInit} from "@angular/core";
import { AppBuilderExternalAssetsService } from 'app-builder-external-assets';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import './cumulocity';
import { VideoModalComponent } from './video-modal.component';

@Component({
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit{

    bsModalRef: BsModalRef;
    mediaList = [];

    constructor(private modalService: BsModalService, private externalService: AppBuilderExternalAssetsService) {}

    ngOnInit() {
        this.mediaList = this.externalService.getAssetsList('MEDIA');
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
}