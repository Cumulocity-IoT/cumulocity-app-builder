import {CoreModule} from "@c8y/ngx-components";
import {NgModule} from "@angular/core";
import {AsyncWidgetLoaderComponent} from "./async-widget-loader.component";
import {AsyncWidgetService} from "./async-widget.service";
import {ɵg as DashboardUpgradeModule} from "@c8y/ngx-components/fesm5/c8y-ngx-components-upgrade";
import {downgradeComponent} from "@angular/upgrade/static";

import "./cumulocity"

declare const angular: any;

angular.module('async-widget', [])
    .directive('asyncWidgetLoader', downgradeComponent({component: AsyncWidgetLoaderComponent}))
    .run(['$templateCache', ($templateCache) => {
        $templateCache.put('async-widget-template.html', `<async-widget-loader [componentid]="child.name" [config]="child.config"/>`);
    }]);

@NgModule({
    imports: [
        CoreModule,
        DashboardUpgradeModule
    ],
    declarations: [AsyncWidgetLoaderComponent],
    entryComponents: [AsyncWidgetLoaderComponent],
    providers: [
        AsyncWidgetService
    ]
})
export class AsyncWidgetLoaderModule {
    constructor(asyncWidgetService: AsyncWidgetService) {
        asyncWidgetService.loadAllAsyncWidgets();
    }
}
