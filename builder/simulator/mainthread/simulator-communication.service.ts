import * as Comlink from "comlink";
import {SimulatorWorkerAPI} from "../worker/simulator-worker-api.service";
import {Injectable} from "@angular/core";

@Injectable({providedIn: 'root'})
export class SimulatorCommunicationService {
    // @ts-ignore
    simulator: Comlink.Remote<SimulatorWorkerAPI> = Comlink.wrap(new Worker('../worker/index.ts', {type: 'module'}));
}
