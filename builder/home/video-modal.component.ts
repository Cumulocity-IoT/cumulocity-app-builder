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

import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    template: `
    <div class="modal-header text-center bg-primary">
        <div style="font-size: 40px;">
            <span c8yIcon="play-circle"></span>
        </div>
        <h4 >{{media.value}}</h4>
    </div>

    <video controls (click)="toggleVideo()" #videoPlayer style="height:100%; width: 100%; outline: none;">
       
        Browser not supported
    </video>
    <div class="c8y-wizard-footer">
        <button class="btn btn-default" (click)="bsModalRef.hide();">Close</button>
    </div>
    `
})
export class VideoModalComponent  implements AfterViewInit{
    media: any;
    mediaURL: string;
    @ViewChild("videoPlayer", { static: false }) videoplayer: ElementRef;
    constructor(private bsModalRef: BsModalRef) {}
    currentMedia: any;
    
    ngAfterViewInit(): void {
        this.videoplayer.nativeElement.src = this.mediaURL;
    }
   
    toggleVideo(event: any) {
        this.videoplayer.nativeElement.play();
    }
}