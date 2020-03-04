import * as Comlink from "comlink";
import {SimulatorWorkerAPI} from "../worker/simulator-worker-api.service";
import {Injectable} from "@angular/core";

@Injectable()
export class SimulatorCommunicationService {
    // @ts-ignore
    simulator: Comlink.Remote<SimulatorWorkerAPI> = Comlink.wrap(new Worker('../worker/simulator-worker.module.ts', {type: 'module'}));
}
