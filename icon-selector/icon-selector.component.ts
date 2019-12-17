import {Component, EventEmitter, Input, Output} from "@angular/core";

import * as fa from "fontawesome";

@Component({
    selector: 'icon-selector',
    templateUrl: './icon-selector.component.html'
})
export class IconSelectorComponent {
    @Input() value: string;
    @Output() valueChange = new EventEmitter<string>();

    items = Object.keys(fa)
        .filter(name => !["html5", "s15", "500px"].includes(name))
        .map(name => name.replace(/[A-Z0-9]/g, match => '-' + match.toLowerCase()))
        .concat(["html5", "s15", "500px"])
        .sort()
        .map(name => ({
            name: name.replace(/-/g, ' ').replace(/\b[a-z]/g, match => match.toUpperCase()),
            className: name.toLowerCase()
        }));

    opened(select) {
        setTimeout(() => {
            select.dropdownPanel._updatePosition();
        }, 25);
    }
}