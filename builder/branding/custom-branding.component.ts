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

import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ApplicationService } from '@c8y/client';


@Component({
    template: `
    <div class="modal-header text-center bg-primary">
        <h4  style="margin:0; letter-spacing: 0.15em;">Save Theme</h4>
    </div>
    <div class="modal-body c8y-wizard-form">
        <form name="saveThemeForm" #saveThemeForm="ngForm" class="c8y-wizard-form">
            <div class="form-group">
                <label for="themeName"><span>Theme Name</span></label>
                <input type="text" class="form-control" id="themeName" name="themeName" placeholder="e.g. Dark (required)" required [(ngModel)]="themeName">
            </div>
        </form>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-default" (click)="bsModalRef.hide()">Cancel</button>
        <button type="button" class="btn btn-primary" [disabled]="!saveThemeForm.form.valid" (click)="saveBranding()">Save</button>
    </div>
  `
})

export class CustomBrandingComponent implements OnInit{
    
    app: any;
    themeName: any;
    constructor(public bsModalRef: BsModalRef, private appService: ApplicationService) { }

    ngOnInit() {
        //console.log(this.app);
    }

    async saveBranding() {
        if (this.app.applicationBuilder.customBranding) {
            this.app.applicationBuilder.customBranding.push({themeName: this.themeName, colors: this.app.applicationBuilder.branding.colors});
        } else {
            this.app.applicationBuilder.customBranding = [];
            this.app.applicationBuilder.customBranding.push({themeName: this.themeName, colors: this.app.applicationBuilder.branding.colors}); 
        }
        console.log(this.app);
        await this.appService.update({
             id: this.app.id,
             applicationBuilder: this.app.applicationBuilder
        } as any);
        this.bsModalRef.hide();
    }
}
