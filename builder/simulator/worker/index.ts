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

/** This file is the main entrypoint for the simulator worker */

/** IE9, IE10, IE11, Evergreen browsers require the following polyfills. */
import '@angular-devkit/build-angular/src/angular-cli-files/models/es5-jit-polyfills.js';
import '@angular-devkit/build-angular/src/angular-cli-files/models/es5-polyfills.js';
import '@angular-devkit/build-angular/src/angular-cli-files/models/jit-polyfills.js';

import {enableProdMode} from "@angular/core";
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
//import {platformBrowserDynamic} from "@angular/platform-webworker-dynamic";
import {SimulatorWorkerModule} from "./simulator-worker.module";

declare const __MODE__: string;
if (__MODE__ === 'production') {
    enableProdMode();
}

// TODO: deprecated, can probably just switch to platformBrowserDynamic because not creating ui on the worker
platformBrowserDynamic().bootstrapModule(SimulatorWorkerModule, { ngZone: 'noop' });
