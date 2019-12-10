import {DeviceSimulator} from "./device-simulator";

export interface SimulationStrategyMetadata {
    name: string,
    icon: string,
    description?: string,
    configComponent?: any
}

export function SimulationStrategy(config: SimulationStrategyMetadata) {
    return function(target: typeof DeviceSimulator) {
        Reflect.defineMetadata('simulationStrategy', [config], target);
    }
}