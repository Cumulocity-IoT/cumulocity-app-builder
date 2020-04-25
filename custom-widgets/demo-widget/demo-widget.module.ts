import {CoreModule, HOOK_COMPONENT} from "@c8y/ngx-components";
import {WidgetConfigDemo} from "./demo-widget-config.component";
import {WidgetDemo} from "./demo-widget.component";
import {NgModule} from "@angular/core";

@NgModule({
    imports: [
        CoreModule
    ],
    declarations: [WidgetDemo, WidgetConfigDemo],
    entryComponents: [WidgetDemo, WidgetConfigDemo],
    providers: [{
        provide: HOOK_COMPONENT,
        multi: true,
        useValue: {
            id: 'acme.text.widget',
            label: 'Text widget',
            description: 'Can display a text',
            component: WidgetDemo,
            configComponent: WidgetConfigDemo,
        }
    }],
})
export class DemoWidgetModule {}
