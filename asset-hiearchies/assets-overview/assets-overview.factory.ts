import { Injectable } from '@angular/core';
import { NavigatorNode, NavigatorNodeFactory, gettext } from '@c8y/ngx-components';

@Injectable()
export class AssetOverviewFactory {
    constructor() { }

    get(): NavigatorNode {
        const assetOverviewNode = new NavigatorNode({
            label: gettext('Assets'),
            path: '/assets',
            icon: 'list',
            priority: 5
        });

        return assetOverviewNode;
    }
}
