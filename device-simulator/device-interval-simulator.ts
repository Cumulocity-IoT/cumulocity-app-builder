import {DeviceSimulator} from "./device-simulator";

export abstract class DeviceIntervalSimulator extends DeviceSimulator {
    protected abstract interval: number;

    private started = false;
    private intervalHandle;

    abstract onTick();

    onStart() {
        if (this.started) throw Error("Simulator already started");
        console.log("Device Simulator started");
        this.intervalHandle = setInterval(() => this.onTick(), this.interval);
        this.started = true;
    }

    onStop() {
        if (!this.started) throw Error("Simulator already stopped");
        clearInterval(this.intervalHandle);
        console.log("Device Simulator stopped");
        this.started = false;
    }

    isStarted(): boolean {
        return this.started;
    }
}