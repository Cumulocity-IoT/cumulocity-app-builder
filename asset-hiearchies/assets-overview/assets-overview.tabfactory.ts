import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TabFactory, Tab } from '@c8y/ngx-components';

@Injectable()
export class AssetTabFactory implements TabFactory {
    constructor(public router: Router) { }

    get() {
        const tabs: Tab[] = [];

        if (this.router.url.match(/assets/g)) {
            tabs.push({
                path: 'assets/overview',
                priority: 100,
                label: 'Overview',
            } as Tab);

            tabs.push({
                path: 'assets/types',
                priority: 90,
                label: 'Types',
            } as Tab);

            tabs.push({
                path: 'assets/property-library',
                priority: 80,
                label: 'Property Library',
            } as Tab);
        }

        return tabs;

    }


}
