import {ContextDashboardModule} from "@c8y/ngx-components/context-dashboard";
import {Type} from "@angular/core";

// Unfortunately this is not part of the public_api so we hack around that
export type ContextDashboardComponent = import("@c8y/ngx-components/context-dashboard/context-dashboard.component").ContextDashboardComponent;
export const ContextDashboardComponent: Type<ContextDashboardComponent> = (ContextDashboardModule as any).__annotations__[0].exports[0];
