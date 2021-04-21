import { Component, ViewEncapsulation } from "@angular/core";

@Component({
    selector: 'progress-indicator-modal',
    templateUrl: './progress-indicator-modal.component.html',
    styleUrls: ['./styles.less'],
    encapsulation: ViewEncapsulation.None,
})
export class ProgressIndicatorModalComponent {

    message: string;
}