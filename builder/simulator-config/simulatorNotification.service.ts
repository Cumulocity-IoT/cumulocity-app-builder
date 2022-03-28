/*
* Copyright (c) 2021 Software AG, Darmstadt, Germany and/or its licensors
*
* SPDX-License-Identifier: Apache-2.0
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
 */
import { Injectable } from '@angular/core';
import { Service, FetchClient } from '@c8y/client';

@Injectable({
  providedIn: 'root'
})
export class SimulatorNotificationService extends Service<any> {  
  baseUrl = 'service';                           
  listUrl = 'simulator-app-builder/simulatorNotification';
  isMSExist = false;
  constructor(client: FetchClient) {             
    super(client);
    this.verifySimulatorMicroServiceStatus();
  }

  post(simulatorNotificationObj) {  
    if(!this.isMSExist) return;                         
    return this.client.fetch(`${this.baseUrl}/${this.listUrl}`, {
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(simulatorNotificationObj),
        method: 'POST'
    })
  }

  remove(simulatorNotificationObj) {  
    if(!this.isMSExist) return;                                     
    return this.client.fetch(`${this.baseUrl}/${this.listUrl}`, {
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(simulatorNotificationObj),
        method: 'DELETE'
    })
  }

  private async verifySimulatorMicroServiceStatus() {
    const response = await this.client.fetch('service/simulator-app-builder/health'); 
    const data = await response.json()
    if(data && data.status && data.status === "UP") { this.isMSExist = true;}
    else { this.isMSExist = false;}
}
}