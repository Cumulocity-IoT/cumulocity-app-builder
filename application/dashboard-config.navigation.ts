import {Injectable} from "@angular/core";
import {_, NavigatorNode, NavigatorNodeFactory} from "@c8y/ngx-components";
import {BehaviorSubject} from "rxjs";
import {ActivationEnd, Router} from "@angular/router";
import {filter, map, startWith} from "rxjs/operators";

@Injectable()
export class DashboardConfigNavigation implements NavigatorNodeFactory {
    nodes = new BehaviorSubject<NavigatorNode[]>([]);

    constructor(private router: Router) {
        // Have to use the router and manually extract path rather than using ActivatedRoute because this route may be an ng1 route
        this.router.events
            .pipe(
                filter(event => event instanceof ActivationEnd),
                map((event: ActivationEnd) => event.snapshot.url),
                map(url => {
                    if (url.length >= 2 && url[0].path === 'application') {
                        const appId = url[1].path;
                        return [
                            new NavigatorNode({
                                label: 'Dashboard Config',
                                icon: 'wrench',
                                path: `/application/${appId}/config`,
                                priority: 0
                            })
                        ]
                    } else {
                        return [];
                    }
                }),
                startWith([])
            )
            // Not sure why I have to use an intermediate behavior subject... seems like a c8y bug?
            .subscribe(this.nodes);
    }

    get() {
        return this.nodes;
    }
}