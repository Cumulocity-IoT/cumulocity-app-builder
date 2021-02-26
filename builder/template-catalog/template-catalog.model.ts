import { IManagedObject } from '@c8y/client';

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
}

export interface CumulocityDashboard {
    children: object;
    name: string;
    icon: string;
    global: boolean;
    isFrozen?: boolean;
    priority?: number;
}

