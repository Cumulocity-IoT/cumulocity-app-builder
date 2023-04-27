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


export interface TemplateCatalogEntry {
    title: string;
    description: string;
    thumbnail: string;
    device?: string;
    manufactur?: string;
    useCase: string;
    dashboard: string;
    comingSoon: boolean;
}

export interface TemplateDetails {
    input: {
        devices?: Array<DeviceDescription>;
        images?: Array<BinaryDescription>;
        dependencies?: Array<DependencyDescription>;
        binaries?: Array<BinaryDescription>;
    },
    description: string;
    preview: string;
    widgets: Array<TemplateDashboardWidget>;
}

export interface TemplateDashboardWidget {
    id?: string;
    name: string;
    _x: number;
    _y: number;
    _height: number;
    _width: number;
    config: object;
    position?: number;
    title?: string;
    templateUrl?: string;
    configTemplateUrl?: string;
}

export interface DeviceDescription {
    type: string;
    placeholder: string;
    reprensentation?: {
        id: string;
        name: string;
    };
}

export interface BinaryDescription {
    type: string;
    placeholder: string;
    id?: string;
    link?: string;
}

export interface DependencyDescription {
    id: string;
    title: string;
    repository: string;
    link: string;
    isInstalled?: boolean;
    fileName?: string;
    requiredPlatformVersion?: string;
    isSupported?: boolean;
    visible?: boolean;
    contextPath?: string;
}

export interface CumulocityDashboard {
    children: object;
    name: string;
    icon: string;
    global: boolean;
    isFrozen?: boolean;
    priority?: number;
}

