import {distinctUntilChanged, filter, first, map, mapTo, switchMap} from "rxjs/operators";
import {ActivationEnd, Router} from "@angular/router";
import {BehaviorSubject, Observable} from "rxjs";
import {Injectable} from "@angular/core";
import {AppStateService} from "@c8y/ngx-components";

@Injectable({providedIn: 'root'})
export class AppIdService {
    /** The latest appId (from the url eg: '/application/123/dashboard/xyz' => '123') */
    appId$ = new BehaviorSubject<string|undefined>(undefined);
    /** same as the appId$ but the value is pended until after the user logs in */
    appIdDelayedUntilAfterLogin$: Observable<string|undefined>;

    constructor(router: Router, appStateService: AppStateService) {
        // Have to use the router and manually extract path rather than using ActivatedRoute because this route may be an ng1 route
        router.events.pipe(
            filter(event => event instanceof ActivationEnd),
            map((event: ActivationEnd) => event.snapshot.url),
            map(url => {
                if (url.length >= 2 && url[0].path === 'application') {
                    return url[1].path;
                } else {
                    return undefined;
                }
            }),
            distinctUntilChanged()
        ).subscribe(this.appId$);

        this.appIdDelayedUntilAfterLogin$ = this.appId$.pipe(
            switchMap(url => appStateService.currentUser.pipe(
                filter(user => user != null),
                first(),
                mapTo(url)
            )
        ));
    }

    /** Gets the current appId (from the url eg: '/application/123/dashboard/xyz' => '123') */
    getCurrentAppId(): string | undefined {
        return this.appId$.getValue();
    }
}