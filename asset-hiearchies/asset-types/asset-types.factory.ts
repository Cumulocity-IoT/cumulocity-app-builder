import { Injectable } from '@angular/core';
import { NavigatorNode, NavigatorNodeFactory, gettext } from '@c8y/ngx-components';

@Injectable()
export class AssetTypesFactory {
    constructor() { }

    get(): NavigatorNode {
        const assetTypeNode = new NavigatorNode({
            label: gettext('Asset Types'),
            path: '/asset-types',
            icon: 'list',
            priority: 1
        });

        return assetTypeNode;
    }
}
