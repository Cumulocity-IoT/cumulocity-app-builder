import {Injectable} from "@angular/core";
import {CanDeactivate} from "@angular/router";
import {BrandingComponent} from "./branding.component";

@Injectable()
export class BrandingDirtyGuardService implements CanDeactivate<BrandingComponent> {
    async canDeactivate(component: BrandingComponent) {
        if (component.dirty) {
            return confirm("Are you sure you want to leave? Any changes will be lost");
        } else {
            return true;
        }
    }
}