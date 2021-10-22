import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({providedIn: 'root'})
export class AppListService {

    refreshAppList$ = new Subject<any>();

    RefreshAppList() {
        this.refreshAppList$.next(true);
    }
}