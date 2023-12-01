/*
* Copyright (c) 2023 Software AG, Darmstadt, Germany and/or its licensors
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

import * as d3 from "d3-color";

export function contextPathFromURL() {
    return window.location.pathname.match(/\/apps\/(.*?)\//)[1];
}

export function colorToHex(color: string): string {
    try {
        return d3.color(color).hex();
    } catch (e) {
        return 'white'
    }
}

export function lighter(color: string, level: number = 1): string {
    try {
        return d3.color(color).brighter(level).hex()
    } catch (e) {
        return 'white'
    }
}

export function darker(color: string): string {
    try {
        return d3.color(color).darker().hex()
    } catch (e) {
        return 'white'
    }
}

export function contrastingTextColor(primaryColor: string): string {
    try {
        const color = d3.color(primaryColor).rgb();
        // Formula from Gacek: https://stackoverflow.com/a/1855903/11530669
        return (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255 > 0.5 ? 'black' : 'white';
    } catch (e) {
        return 'white';
    }
}