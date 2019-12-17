import {Component, OnDestroy} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {ApplicationService} from "@c8y/client";
import {map, switchMap} from "rxjs/operators";
import {from, Observable} from "rxjs";
import {BrandingService} from "./branding.service";

@Component({
    templateUrl: './branding.component.html'
})
export class BrandingComponent implements OnDestroy {
    app: Observable<any>;
    dirty = false;

    constructor(private route: ActivatedRoute, private appService: ApplicationService, private brandingService: BrandingService) {
        const appId = route.paramMap.pipe(
            map(paramMap => paramMap.get('applicationId'))
        );

        this.app = appId.pipe(
            switchMap(appId => from(
                appService.detail(appId)
                    .then(res => res.data as any)
            ))
        );
    }

    async save(app) {
        this.dirty = false;
        await this.appService.update({
            id: app.id,
            applicationBuilder: app.applicationBuilder
        } as any);

        this.brandingService.updateStyleForApp(app);
    }

    showBrandingChange(app) {
        this.dirty = true;
        this.brandingService.updateStyleForApp(app);
    }

    async ngOnDestroy(): Promise<void> {
        const appId = this.route.snapshot.paramMap.get('applicationId');
        const app = ((await this.appService.detail(appId)).data as any);
        this.brandingService.updateStyleForApp(app);
    }

    async logoChange(app, files: FileList) {
        const file = files.item(0);
        if (file) {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.addEventListener("load", () => {
                    resolve(reader.result as string);
                }, false);
                reader.addEventListener("error", () => reject(new Error("Failed to read file")));
                reader.readAsDataURL(file);
            });

            const [logoWidth, logoHeight] = await new Promise<[number, number]>((resolve, reject) => {
                const img = new Image();
                img.addEventListener("load", () => {
                    resolve([img.width, img.height]);
                }, false);
                img.addEventListener("error", () => reject(new Error("Failed to read file")));
                img.src = dataUrl;
            });
            app.applicationBuilder.branding.logo = dataUrl;
            app.applicationBuilder.branding.logoHeight = Math.min(logoHeight, Math.ceil(240*logoHeight/logoWidth));
        } else {
            this.removeLogo(app);
            return;
        }
        this.showBrandingChange(app);
    }

    removeLogo(app) {
        app.applicationBuilder.branding.logo = undefined;
        app.applicationBuilder.branding.hideIcon = false;
        app.applicationBuilder.branding.logoHeight = undefined;
        this.showBrandingChange(app);
    }

    setTheme(app, primary, active, text, textOnPrimary, textOnActive) {
        app.applicationBuilder.branding.enabled = true;
        app.applicationBuilder.branding.colors.primary = primary;
        app.applicationBuilder.branding.colors.active = active;
        app.applicationBuilder.branding.colors.text = text;
        app.applicationBuilder.branding.colors.textOnPrimary = textOnPrimary;
        app.applicationBuilder.branding.colors.textOnActive = textOnActive;
        this.showBrandingChange(app);
    }
}