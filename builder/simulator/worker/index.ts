/** IE9, IE10, IE11, Evergreen browsers require the following polyfills. */
import '@angular-devkit/build-angular/src/angular-cli-files/models/es5-jit-polyfills.js';
import '@angular-devkit/build-angular/src/angular-cli-files/models/es5-polyfills.js';
import '@angular-devkit/build-angular/src/angular-cli-files/models/jit-polyfills.js';

import {enableProdMode} from "@angular/core";
import {platformWorkerAppDynamic} from "@angular/platform-webworker-dynamic";
import {SimulatorWorkerModule} from "./simulator-worker.module";

declare const __MODE__: string;
if (__MODE__ === 'production') {
    enableProdMode();
}

// TODO: deprecated, can probably just switch to platformBrowserDynamic because not creating ui on the worker
platformWorkerAppDynamic().bootstrapModule(SimulatorWorkerModule, { ngZone: 'noop' });
