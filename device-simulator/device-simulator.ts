import {DeviceHandle} from "./device-handle";

export abstract class DeviceSimulator {
    constructor(public instanceName: string, protected config: any, protected device: DeviceHandle) {}

    start() {
        this.onStart();
    }
    stop() {
        this.onStop();
    }

    abstract onStart();
    abstract onStop();
    abstract isStarted(): boolean;
    onReset() {};

    updateConfig(config: any) {};
}