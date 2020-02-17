import { Injectable } from '@angular/core';
import { InventoryService } from '@c8y/ngx-components/api';

@Injectable({ providedIn: "root" })
export class SimulationLockService {

    constructor(private inventoryService: InventoryService) { }


    /**
     *
     * ActionSession flag in Session Storage
     * Used to identify that which browser session in active when user refresh browser
     * This method is called when User start simulator and lock it
     * @param {*} status
     * @memberof SimulationLockService
     */
    updateActiveSession(status){
        sessionStorage.setItem('isActiveSession', status);
    }

    /**
     * Check if current session in Active or not.
     * Used to identify that which browser session in active when user refresh browser
     * @returns
     * @memberof SimulationLockService
     */
    isActiveSession(){
        return (sessionStorage.getItem('isActiveSession') === 'true' ? true : false) ;
    }


    /**
     *
     * Update lock status in manageObject
     * This method is called when Simulator start or Stop
     * @param {*} simulatorStatus
     * @param {*} currentUserDetails
     * @param {*} appId
     * @param {*} simulators
     * @memberof SimulationLockService
     */
    async updateLock(simulatorStatus, currentUserDetails, appId, simulators){
        const query = {
            applicationId:appId
       }
       let isFirstRequest = false;
        let inventoryServiceData = (await this.inventoryService.listQuery( query)).data as any;
        if(inventoryServiceData.length === 0)
            isFirstRequest = true;
        else
            inventoryServiceData = inventoryServiceData[0];

        let simulatorsLock = inventoryServiceData.simulatorsLock;
        if (simulatorStatus) {
            this.updateActiveSession(simulatorStatus);
            simulatorsLock = {
                isLocked: true,
                lockedBy: currentUserDetails.id,
                lockedOn: new Date().toISOString(),
                lockedDisplayName: currentUserDetails.userName
            }
            inventoryServiceData.simulatorLockTracker = new Date().toISOString();
        } else {
            let simulatorsStatus = simulators
                .filter(x => x.config.isSimulatorStarted === true);
            if (simulatorsStatus.length === 0) {
                this.updateActiveSession(simulatorStatus);
                simulatorsLock = {
                    isLocked: false,
                    lockedBy: '',
                    lockedOn: '',
                    lockedDisplayName: ''
                }
            }
        }
        inventoryServiceData.simulatorsLock = simulatorsLock;
        if(isFirstRequest){
            inventoryServiceData.applicationId = appId;
            this.inventoryService.create({
                ...inventoryServiceData
            });
        } else {
            this.inventoryService.update({
                ...inventoryServiceData
            });
        }
    }
}