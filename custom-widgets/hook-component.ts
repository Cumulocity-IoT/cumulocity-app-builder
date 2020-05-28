import {InjectionToken} from "@angular/core";

// Patch @c8y/ngx-components to include a HOOK_COMPONENT for backwards compatibility
declare module "@c8y/ngx-components" {
    const HOOK_COMPONENT: InjectionToken<unknown>;
}
const ngxComps = require("@c8y/ngx-components");
if (ngxComps.HOOK_COMPONENT === undefined) {
    ngxComps.HOOK_COMPONENT = ngxComps.HOOK_COMPONENTS;
}
