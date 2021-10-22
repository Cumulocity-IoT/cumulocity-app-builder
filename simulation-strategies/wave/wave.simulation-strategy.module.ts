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
import {WaveSimulationStrategyConfigComponent} from "./wave.config.component";
import {WaveSimulationStrategyFactory} from "./wave.simulation-strategy";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import { HOOK_SIMULATION_STRATEGY_FACTORY } from '../../builder/simulator/device-simulator';
import { DeviceSelectorModule } from '../../device-selector/device-selector.module';
import { AccordionModule } from 'ngx-bootstrap/accordion';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        AccordionModule.forRoot(),
        DeviceSelectorModule
    ],
    declarations: [
        WaveSimulationStrategyConfigComponent
    ],
    exports: [
        WaveSimulationStrategyConfigComponent
    ],
    entryComponents: [
        WaveSimulationStrategyConfigComponent
    ],
    providers: [
        { provide: HOOK_SIMULATION_STRATEGY_FACTORY, useClass: WaveSimulationStrategyFactory, multi: true },
    ]
})
export class WaveSimulationStrategyModule {}
