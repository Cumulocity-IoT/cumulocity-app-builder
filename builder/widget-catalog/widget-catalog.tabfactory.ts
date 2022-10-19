import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TabFactory, Tab } from '@c8y/ngx-components';

@Injectable()
export class WidgetCatalogTabFactory implements TabFactory {
    constructor(public router: Router) { }

    get() {
        const tabs: Tab[] = [];

        if (this.router.url.match(/plugin-catalog/g)) {
            tabs.push({
                path: 'plugin-catalog/my-plugins',
                priority: 100,
                label: 'My Plugins',
                icon: 'registry-editor'
            } as Tab);

            tabs.push({
                path: 'plugin-catalog/get-plugins',
                priority: 90,
                label: 'Get More Plugins',
                icon: 'pull-down'
            } as Tab);
        }
        return tabs;
    }


}
