export interface IAppBuilder {
    id?: any;
    appBuilderId?: any;
    type?: string;
    analyticsProvider?: IAnalyticsProvider[];
    c8y_Global?: any;
}
export interface IAnalyticsProvider {
    id?: any;
    providerName?: string;
    providerURL?: string;
    providerKey?: string;
    providerIdentity?: string;
    providerAccountId?: string;
    providerAccountName?: string;
    isActive?: boolean;
}