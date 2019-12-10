import {Injectable} from "@angular/core";
import {_, NavigatorNode, NavigatorNodeFactory} from "@c8y/ngx-components";
import {BehaviorSubject} from "rxjs";
import {ActivationEnd, Router} from "@angular/router";
import {filter, map, startWith} from "rxjs/operators";

@Injectable()
export class ApplicationBuilderNavigation implements NavigatorNodeFactory {
    nodes = new BehaviorSubject<NavigatorNode[]>([]);

    constructor(private router: Router) {
        // Have to use the router and manually extract path rather than using ActivatedRoute because this route may be an ng1 route
        this.router.events
            .pipe(
                filter(event => event instanceof ActivationEnd),
                map((event: ActivationEnd) => event.snapshot.url),
                map(url => {
                    if (url.length >= 2 && url[0].path === 'application') {
                        return []
                    } else {
                        return [
                            new NavigatorNode({
                                label: 'Configuration',
                                icon: 'wrench',
                                path: `/application-builder`,
                                priority: 0
                            }),
                            new NavigatorNode({
                                label: 'Help',
                                icon: 'question',
                                path: `/help`,
                                priority: 0
                            })
                        ];
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