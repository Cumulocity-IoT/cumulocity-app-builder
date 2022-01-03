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

import {Component, EventEmitter, Input, Output} from "@angular/core";

import * as fa from "fontawesome";
import * as icons from "./ignore-font-icons";
@Component({
    selector: 'icon-selector',
    templateUrl: './icon-selector.component.html'
})
export class IconSelectorComponent {
    @Input() value: string;
    @Input() appendTo: string;
    @Output() valueChange = new EventEmitter<string>();

    // Create a list of all icons
    items = Object.keys(fa)
        .filter(name => !["html5", "s15", "500px"].includes(name))
        .map(name => name.replace(/[A-Z0-9]/g, match => '-' + match.toLowerCase()))
        .concat(["html5", "s15", "500px"])
        .filter(name => !icons.ignoreIcons.includes(name))
        .sort()
        .map(name => ({
            name: name.replace(/-/g, ' ').replace(/\b[a-z]/g, match => match.toUpperCase()),
            className: name.toLowerCase()
        }));
    opened(select) {
        setTimeout(() => {
            try {
                select.dropdownPanel._updatePosition();
            }
            catch(e) { 
                // Ignore error
            }
            
        }, 25);
    }
}
