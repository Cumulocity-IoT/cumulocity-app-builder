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

import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import { HOOK_SIMULATION_STRATEGY_FACTORY } from '../../builder/simulator/device-simulator';
import { DeviceSelectorModule } from '../../device-selector/device-selector.module';
import { FileValuesSimulationStrategyConfigComponent } from "./file-values.config.component";
import { FileValuesSimulationStrategyFactory } from "./file-values.simulation-strategy";
import { ButtonsModule } from "ngx-bootstrap/buttons";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { NgSelectModule } from "@ng-select/ng-select";


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        DeviceSelectorModule,
        NgSelectModule,
        ButtonsModule.forRoot(),
        AccordionModule.forRoot(),
    ],
    declarations: [
        FileValuesSimulationStrategyConfigComponent
    ],
    exports: [
        FileValuesSimulationStrategyConfigComponent
    ],
    entryComponents: [
        FileValuesSimulationStrategyConfigComponent
    ],
    providers: [
        { provide: HOOK_SIMULATION_STRATEGY_FACTORY, useClass: FileValuesSimulationStrategyFactory, multi: true },
    ]
})
export class FileValuesSimulationStrategyModule {}
