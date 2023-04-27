import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({providedIn: 'root'})
  export class ProgressIndicatorService {

    progress$ = new Subject<number>();
    overallProgress$ = new Subject<number>();
    message$ = new Subject<string>();

    setProgress(progress: number) {
        this.progress$.next(progress);
    }

    setOverallProgress(progress: number) {
      this.overallProgress$.next(progress);
  }

    setMessage(message: string) {
      this.message$.next(message);
    }
  
  }