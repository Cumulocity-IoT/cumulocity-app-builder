import {IApplication} from "@c8y/client";

export type IApplicationBuilderApplication = IApplication & {
    applicationBuilder: {
        dashboards: {
            id: string,
            name: string,
            tabGroup?: string,
            visibility?: '' | 'hidden' | 'no-nav',
            icon: string,
            deviceId?: string,
            groupTemplate?: boolean
        }[]
    }
}
