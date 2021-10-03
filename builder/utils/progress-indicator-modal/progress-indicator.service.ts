import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
  export class ProgressIndicatorService {

    progress$ = new Subject<number>();

    setProgress(progress: number) {
        this.progress$.next(progress);
    }
  }