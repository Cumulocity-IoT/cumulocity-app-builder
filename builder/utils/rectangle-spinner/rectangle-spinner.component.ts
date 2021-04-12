import { Component, Input } from "@angular/core";

@Component({
    selector: 'rectangle-spinner',
    templateUrl: './rectangle-spinner.component.html',
    styleUrls: ['styles.less']
})
export class RectangleSpinnerComponent {
    @Input() message: string;
}