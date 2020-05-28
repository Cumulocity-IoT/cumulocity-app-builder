// Patch @c8y/ngx-components to include HOOK_COMPONENT for backwards compatibility
import './hook-component'

import {NgModule} from "@angular/core";
// import {DemoWidgetModule} from "./demo-widget/demo-widget.module";

// Add ng1 widgets here
// import './collada-widget/cumulocity'

@NgModule({
    imports: [
        // Add ngx widgets here
        // DemoWidgetModule
    ]
})
export class CustomWidgetsModule {}
