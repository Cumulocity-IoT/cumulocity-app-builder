/*
* Copyright (c) 2019 Software AG, Darmstadt, Germany and/or its licensors
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

import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { IManagedObject, Realtime, InventoryService } from '@c8y/client';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'c8y-dashboard-node',
  templateUrl: './dashboard-node.component.html'
})
export class DashboardNodeComponent implements OnInit {
  @Input() node: any;
  @Input() selectedNode: any;
  @Output() nodeClick = new EventEmitter<any>();

  objectKeys = Object.keys;
  isCollapsed = true;
  ngOnInit() {
    console.log(this.node);
  }
  nodeClicked() {
    this.nodeClick.emit(this.node);
  }
  nodeChildClicked(node: any) {
    this.nodeClick.emit(node);
  }

  expendCollapsedToggle(node: any){
    if(node.children && Object.keys(node.children).length > 0){ 
      this.isCollapsed = !this.isCollapsed;
    }
  }
}
