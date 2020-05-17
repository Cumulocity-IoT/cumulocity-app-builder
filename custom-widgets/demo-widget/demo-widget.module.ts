import {CoreModule, HOOK_COMPONENTS} from "@c8y/ngx-components";
import {DemoWidgetConfig} from "./demo-widget-config.component";
import {DemoWidget} from "./demo-widget.component";
import {NgModule} from "@angular/core";

@NgModule({
    imports: [
        CoreModule
    ],
    declarations: [DemoWidget, DemoWidgetConfig],
    entryComponents: [DemoWidget, DemoWidgetConfig],
    providers: [{
        provide: HOOK_COMPONENTS,
        multi: true,
        useValue: {
            id: 'acme.demo.widget',
            label: 'Demo widget',
            description: 'Displays mirrored text',
            component: DemoWidget,
            configComponent: DemoWidgetConfig
        }
    }],
})
export class DemoWidgetModule {}
