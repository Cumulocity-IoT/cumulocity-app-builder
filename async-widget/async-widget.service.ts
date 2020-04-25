import {Compiler, ComponentFactoryResolver, Injectable, Injector, NgModuleRef} from "@angular/core";
import {AppStateService, HOOK_COMPONENT} from "@c8y/ngx-components";
import {ɵj as DashboardBridgeService} from "@c8y/ngx-components/fesm5/c8y-ngx-components-upgrade";
import {ReplaySubject} from "rxjs";
import {first, map} from "rxjs/operators";
import {corsImport} from "webpack-external-import";

interface WidgetConfig {
    id: string,
    label?: string,
    description?: string,
    component: any,
    configComponent?: any,
}

@Injectable()
export class AsyncWidgetService {
    loaded = new ReplaySubject<WidgetConfig[]>(1);

    constructor(private compiler: Compiler, private injector: Injector, private componentFactoryResolver: ComponentFactoryResolver, private appStateService: AppStateService) {
    }

    async loadAllAsyncWidgets() {
        const manifest = await (await fetch(`cumulocity.json?${Date.now()}`)).json();

        const contextPaths = manifest.widgetContextPaths || [];

        for (const contextPath of contextPaths) {
            // Don't need to wait for login, application code is public
            await (corsImport(`/apps/${contextPath}/importManifest.js?${Date.now()}`)
                .catch((e) => {
                    console.error(`Unable to find widget manifest: /apps/${contextPath}/importManifest.js\n`, e)
                }));
        }

        // Load the js files containing the custom widgets
        const jsModules = [];
        for (const contextPath of contextPaths) {
            try {
                // @ts-ignore
                const jsModule = await __webpack_require__.interleaved(`${contextPath}/${contextPath}-CustomWidget`);
                jsModules.push(jsModule);
            } catch (e) {
                console.error(`Module: ${contextPath}, did not contain a custom widget\n`, e);
            }
        }

        // Load and compile the angular modules
        let currentInjector = this.injector;
        const ngModules: NgModuleRef<unknown>[] = [];
        for (const jsModule of jsModules) {
            for (const exportedObj of Object.values(jsModule) as any[]) {
                // Check if the exportedObj is an angular module
                if (exportedObj.hasOwnProperty('__annotations__') && exportedObj.__annotations__.some(annotation => annotation.__proto__.ngMetadataName === "NgModule")) {
                    try {
                        // Compile the angular module
                        const ngModuleFactory = await this.compiler.compileModuleAsync(exportedObj);
                        // Create an instance of the module
                        const ngModule = ngModuleFactory.create(currentInjector)
                        // Chain the injectors together
                        currentInjector = ngModule.injector;

                        ngModules.push(ngModule);
                    } catch(e) {
                        console.error(`Failed to compile widgets in module:`, jsModule, '\n', e);
                    }
                }
            }
        }

        // Pull out all of the widgets from those angular modules
        const widgetConfigs: WidgetConfig[] = [];
        for (const ngModule of ngModules) {
            const dashboardBridgeService = this.injector.get(DashboardBridgeService);
            const widgets = ngModule.injector.get<WidgetConfig[]>(HOOK_COMPONENT) || [];

            // Add the widget components into angular

            // Step1: Add all of the providers (usually services used by the widgets)
            (this.componentFactoryResolver as any)._ngModule = ngModule;

            // Step2: Add all of the component factories
            for (const widget of widgets) {
                ((this.componentFactoryResolver as any)._factories as Map<any, any>)
                    .set(widget.component, ngModule.componentFactoryResolver.resolveComponentFactory(widget.component));
                if (widget.configComponent) {
                    ((this.componentFactoryResolver as any)._factories as Map<any, any>)
                        .set(widget.configComponent, ngModule.componentFactoryResolver.resolveComponentFactory(widget.configComponent));
                }
            }

            // Add the widgets into cumulocity
            dashboardBridgeService.registerComponents(widgets, true);

            widgetConfigs.push(...widgets);
        }

        this.loaded.next(widgetConfigs);
    }

    widgetLoaded(widgetId: string): Promise<WidgetConfig | undefined> {
        return this.loaded
            .pipe(
                map(widgets => widgets.find(widget => widget.id === widgetId)),
                first()
            )
            .toPromise();
    }
}
