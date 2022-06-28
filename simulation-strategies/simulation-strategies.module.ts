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
import {SeriesValueSimulationStrategyModule} from "./series-values/series-value.simulation-strategy.module";
import {RandomValueSimulationStrategyModule} from "./random-values/random-value.simulation-strategy.module";
import {RandomWalkSimulationStrategyModule} from "./random-walk/random-walk.simulation-strategy.module";
import {WaveSimulationStrategyModule} from "./wave/wave.simulation-strategy.module";
import {FirmwareUpdateSimulationStrategyModule} from "./firmware-update/firmware-update.simulation-strategy.module";
import { DtdlSimulationStrategyModule } from './dtdl/dtdl.simulation-strategy.module';
import { PositionUpdateSimulationStrategyModule } from './position-update/position-update.simulation-strategy.module';
import { FileValuesSimulationStrategyModule } from "./file-values/file-values.simulation-strategy.module";

@NgModule({
    imports: [
        SeriesValueSimulationStrategyModule,
        RandomValueSimulationStrategyModule,
        RandomWalkSimulationStrategyModule,
        WaveSimulationStrategyModule,
        FirmwareUpdateSimulationStrategyModule,
        DtdlSimulationStrategyModule,
        PositionUpdateSimulationStrategyModule,
        FileValuesSimulationStrategyModule
    ]
})
export class SimulationStrategiesModule {}
