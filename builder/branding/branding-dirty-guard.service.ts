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

import {Injectable} from "@angular/core";
import {CanDeactivate} from "@angular/router";
import {BrandingComponent} from "./branding.component";

/**
 * If the branding component has any unsaved changes then this asks the user to confirm that they want to leave
 */
@Injectable()
export class BrandingDirtyGuardService implements CanDeactivate<BrandingComponent> {
    async canDeactivate(component: BrandingComponent) {
        if (component.dirty) {
            return confirm("Are you sure you want to leave? Any changes will be lost");
        } else {
            return true;
        }
    }
}
