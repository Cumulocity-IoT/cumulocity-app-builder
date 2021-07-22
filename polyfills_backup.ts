/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main
 *      file.
 *
 * The current setup is for so-called "evergreen" browsers; the last versions of browsers that
 * automatically update themselves. This includes Safari >= 10, Chrome >= 55 (including Opera),
 * Edge >= 13 on the desktop, and iOS 10 and Chrome on mobile.
 *
 * Learn more in https://angular.io/docs/ts/latest/guide/browser-support.html
 */

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/** IE9, IE10, IE11, Evergreen browsers require the following polyfills. */
import '@angular-devkit/build-angular/src/angular-cli-files/models/es5-jit-polyfills.js';
import '@angular-devkit/build-angular/src/angular-cli-files/models/es5-polyfills.js';
import '@angular-devkit/build-angular/src/angular-cli-files/models/jit-polyfills.js';

/**
 * By default, zone.js will patch all possible macroTask and DomEvents
 * user can disable parts of macroTask/DomEvents patch by setting following flags
 */

(window as any).__Zone_disable_requestAnimationFrame = true; // disable patch requestAnimationFrame
// (window as any).__Zone_disable_on_property = true; // disable patch onProperty such as onclick
(window as any).__zone_symbol__BLACK_LISTED_EVENTS = ['scroll', 'mousemove', 'message', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave']; // disable patch specified eventNames

/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import 'zone.js/dist/zone'; // Included with Angular CLI.

/***************************************************************************************************
 * APPLICATION IMPORTS
 */
import 'url-search-params-polyfill';
import { addPolyfills } from '@c8y/ngx-components/polyfills';
addPolyfills();
