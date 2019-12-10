import {InjectionToken, NgModule} from "@angular/core";
import {FixedValueSimulationStrategyConfigComponent} from "./fixed-value.config.component";
import {SimulationStrategy} from "../../device-simulator/simulation-strategy.decorator";
import {FixedValueSimulationStrategy} from "./fixed-value.simulation-strategy";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";

export const HOOK_SIMULATION_STRATEGY = new InjectionToken('SimulationStrategy');

@NgModule({
    imports: [
        CommonModule,
        FormsModule
    ],
    declarations: [
        FixedValueSimulationStrategyConfigComponent
    ],
    exports: [
        FixedValueSimulationStrategyConfigComponent
    ],
    entryComponents: [
        FixedValueSimulationStrategyConfigComponent
    ],
    providers: [
        { provide: HOOK_SIMULATION_STRATEGY, useValue: FixedValueSimulationStrategy, multi: true }
    ]
})
export class FixedValueSimulationStrategyModule {}