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
import {RouterModule} from "@angular/router";
import {SimulatorConfigComponent} from "./simulator-config.component";
import {CommonModule} from "@angular/common";
import {NewSimulatorModalComponent} from "./new-simulator-modal.component";
import {WizardModule} from "../../wizard/wizard.module";
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import {EditSimulatorModalComponent} from "./edit-simulator-modal.component";
import { DeviceSelectorModule } from '../../device-selector/device-selector.module';
import { SimulatorConfigService } from "./simulator-config.service";

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
                component: SimulatorConfigComponent
            }
        ]),
        CoreModule,
        WizardModule,
        BsDropdownModule.forRoot(),
        ButtonsModule.forRoot(),
        DeviceSelectorModule
    ],
    declarations: [
        SimulatorConfigComponent,
        NewSimulatorModalComponent,
        EditSimulatorModalComponent
    ],
    entryComponents: [
        NewSimulatorModalComponent,
        EditSimulatorModalComponent
    ],
    providers: [
        SimulatorConfigService
    ]
})
export class SimulatorConfigModule {
    static withNavigation(): ModuleWithProviders<SimulatorConfigModule> {
        return {
            ngModule: SimulatorConfigModule,
            providers: [
                { provide: HOOK_NAVIGATOR_NODES, useClass: DeviceSimulatorConfigNavigation, multi: true}
            ]
        }
    }
}
