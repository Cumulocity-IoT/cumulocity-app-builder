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

export interface WidgetCatalog {
    id: string;
    name: string;
    description: string;
    lastUpdated: string;
    contact: string
    widgets: WidgetModel[];
}
export interface WidgetModel {
    id?: string;
    title?: string;
    repository?: string;
    binaryLink?: string;
    link?: string;
    fileName?: string;
    contextPath?: string;
    icon?: string;
    author?:string;
    license?: string;
    requiredPlatformVersion?: string;
    version?: string;
    selected?: boolean;
    installed?: boolean;
    preview?: string;
    isReloadRequired?: boolean;
    isCompatible?: boolean;
    installedVersion?: string;
    actionCode?: string;
    isDeprecated?: boolean;
    releaseDate?: string;
    isNextVersionAvailable?: boolean;
    moduleName?: string;
    oldContextPath?: string;
}