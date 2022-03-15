import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({providedIn: 'root'})
  export class ProgressIndicatorService {

    progress$ = new Subject<number>();

    setProgress(progress: number) {
        this.progress$.next(progress);
    }
  }