import {Type} from "@angular/core";
import {ContextDashboardComponent} from "./context-dashboard.component";

// Unfortunately this is not part of the public_api so we hack around that
export type WidgetService = import("@c8y/ngx-components/context-dashboard/widget.service").WidgetService;
export const WidgetService: Type<WidgetService> = (ContextDashboardComponent as any).ctorParameters()[6].type;
