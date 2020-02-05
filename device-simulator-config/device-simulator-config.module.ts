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

import {HOOK_NAVIGATOR_NODES, NavigatorNode, NavigatorNodeFactory, _, CoreModule} from "@c8y/ngx-components";
import {Injectable, ModuleWithProviders, NgModule} from "@angular/core";
import {RouterModule, Router, ActivationEnd} from "@angular/router";
import {DeviceSimulatorConfigComponent} from "./device-simulator-config.component";
import {CommonModule} from "@angular/common";
import {NewSimulatorModalComponent} from "./new-simulator-modal.component";
import {WizardModule} from "../wizard/wizard.module";
import {ContribNgForInModule} from "@angular-contrib/common";
import {BsDropdownModule} from "ngx-bootstrap";
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import {EditSimulatorModalComponent} from "./edit-simulator-modal.component";
import { DeviceSimulatorService } from '../device-simulator/device-simulator.service';

@Injectable()
class DeviceSimulatorConfigNavigation implements NavigatorNodeFactory {
    nodes: NavigatorNode[] = [
        new NavigatorNode({
            label: _('Simulator Config'),
            icon: 'wrench',
            path: '/simulator-config',
            priority: 0
        })
    ];
    
    //TODO: Not in use for now
    get() {
        return this.nodes;
    }
}

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild([
            {
                path: 'simulator-config',
                component: DeviceSimulatorConfigComponent
            }
        ]),
        CoreModule,
        ContribNgForInModule,
        WizardModule,
        BsDropdownModule.forRoot(),
        ButtonsModule.forRoot()
    ],
    declarations: [
        DeviceSimulatorConfigComponent,
        NewSimulatorModalComponent,
        EditSimulatorModalComponent
    ],
    entryComponents: [
        NewSimulatorModalComponent,
        EditSimulatorModalComponent
    ],
    providers: [
        DeviceSimulatorService,
        { provide: HOOK_NAVIGATOR_NODES, useExisting: DeviceSimulatorService, multi: true },
    ]
})
export class DeviceSimulatorConfigModule {
    static withNavigation(): ModuleWithProviders {
        return {
            ngModule: DeviceSimulatorConfigModule,
            providers: [
                { provide: HOOK_NAVIGATOR_NODES, useClass: DeviceSimulatorConfigNavigation, multi: true}
            ]
        }
    }
}