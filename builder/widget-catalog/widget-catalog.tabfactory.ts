import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TabFactory, Tab } from '@c8y/ngx-components';

@Injectable()
export class WidgetCatalogTabFactory implements TabFactory {
    constructor(public router: Router) { }

    get() {
        const tabs: Tab[] = [];

        if (this.router.url.match(/widget-catalog/g)) {
            tabs.push({
                path: 'widget-catalog/my-widgets',
                priority: 100,
                label: 'My Widgets',
                icon: 'packages'
            } as Tab);

            tabs.push({
                path: 'widget-catalog/get-widgets',
                priority: 90,
                label: 'Get More Widgets',
                icon: 'archive-file'
            } as Tab);
        }
        return tabs;
    }


}
