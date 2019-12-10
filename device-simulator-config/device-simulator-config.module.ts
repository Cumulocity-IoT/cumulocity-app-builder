import {HOOK_NAVIGATOR_NODES, NavigatorNode, NavigatorNodeFactory, _, CoreModule} from "@c8y/ngx-components";
import {Injectable, ModuleWithProviders, NgModule} from "@angular/core";
import {RouterModule} from "@angular/router";
import {DeviceSimulatorConfigComponent} from "./device-simulator-config.component";
import {CommonModule} from "@angular/common";
import {NewSimulatorModalComponent} from "./new-simulator-modal.component";
import {WizardModule} from "../wizard/wizard.module";
import {ContribNgForInModule} from "@angular-contrib/common";
import {BsDropdownModule} from "ngx-bootstrap";
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import {EditSimulatorModalComponent} from "./edit-simulator-modal.component";

@Injectable()
class DeviceSimulatorConfigNavigation implements NavigatorNodeFactory {
    nodes: NavigatorNode[] = [
        new NavigatorNode({
            label: _('Simulator Config'),
            icon: 'wrench',
            path: '/simulator-config',
            priority: 0
        })
    ];

    get() {
        return this.nodes;
    }
}

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild([
            {
                path: 'simulator-config',
                component: DeviceSimulatorConfigComponent
            }
        ]),
        CoreModule,
        ContribNgForInModule,
        WizardModule,
        BsDropdownModule.forRoot(),
        ButtonsModule.forRoot()
    ],
    declarations: [
        DeviceSimulatorConfigComponent,
        NewSimulatorModalComponent,
        EditSimulatorModalComponent
    ],
    entryComponents: [
        NewSimulatorModalComponent,
        EditSimulatorModalComponent
    ]
})
export class DeviceSimulatorConfigModule {
    static withNavigation(): ModuleWithProviders {
        return {
            ngModule: DeviceSimulatorConfigModule,
            providers: [
                { provide: HOOK_NAVIGATOR_NODES, useClass: DeviceSimulatorConfigNavigation, multi: true}
            ]
        }
    }
}