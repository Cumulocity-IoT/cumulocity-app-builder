import { Component, Input } from '@angular/core';

@Component({
    template: `<p class="text">{{config?.text || 'No text'}}</p>`,
    styles: [ `.text { transform: scaleX(-1); font-size: 3em ;}` ]
})
export class DemoWidget {
    @Input() config;
}
