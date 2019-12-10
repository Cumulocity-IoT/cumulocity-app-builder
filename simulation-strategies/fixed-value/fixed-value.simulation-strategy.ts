import {FixedValueSimulationStrategyConfigComponent} from "./fixed-value.config.component";
import {SimulationStrategy} from "../../device-simulator/simulation-strategy.decorator";
import {DeviceIntervalSimulator} from "../../device-simulator/device-interval-simulator";

@SimulationStrategy({
    name: "Fixed Value",
    icon: "minus",
    description: "Simulates a flat line",
    configComponent: FixedValueSimulationStrategyConfigComponent
})
export class FixedValueSimulationStrategy extends DeviceIntervalSimulator {
    protected interval = 1000;

    onTick() {
        this.device.sendMeasurement(this.config.value);
    }
}