import { Injectable } from '@angular/core';
import { NavigatorNode, NavigatorNodeFactory, gettext } from '@c8y/ngx-components';

@Injectable()
export class PropertiesLibraryFactory {
    constructor() { }

    get(): NavigatorNode {
        const propertiesLibraryNode = new NavigatorNode({
            label: gettext('Properties Library'),
            path: '/properties-library',
            icon: 'list',
            priority: 10
        });

        return propertiesLibraryNode;
    }
}
