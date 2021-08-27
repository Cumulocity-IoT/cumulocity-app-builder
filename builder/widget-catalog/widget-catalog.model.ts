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
}