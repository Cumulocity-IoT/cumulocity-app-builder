import { Component, OnDestroy, ViewEncapsulation } from "@angular/core";
import { Subscription } from 'rxjs';
import { ProgressIndicatorService } from './progress-indicator.service';

@Component({
    selector: 'progress-indicator-modal',
    templateUrl: './progress-indicator-modal.component.html',
    styleUrls: ['./styles.less'],
    encapsulation: ViewEncapsulation.None,
})
export class ProgressIndicatorModalComponent implements OnDestroy {

    message: string;
    progressStatus =  '0';
    overallProgressStatus = '0';
    progressSub: Subscription;
    overallProgressSub: Subscription;
    messageSub: Subscription;
    constructor(private progressIndicatorService: ProgressIndicatorService) {
        this.progressSub = this.progressIndicatorService.progress$.subscribe( (v: any) => {
            this.progressStatus = v + '%';
        })
        this.overallProgressSub = this.progressIndicatorService.overallProgress$.subscribe( (v: any) => {
            this.overallProgressStatus = v + '%';
        })
        this.messageSub = this.progressIndicatorService.message$.subscribe( (message: any) => {
            this.message = message;
        })
    }

    ngOnDestroy(): void {
        this.progressSub.unsubscribe();
        this.overallProgressSub.unsubscribe();
        this.messageSub.unsubscribe();
    }
}