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

import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter, Inject, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';

@Component({
  selector: 'c8y-dashboard-node',
  templateUrl: './dashboard-node.component.html',
  styleUrls: ['dashboard-node.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardNodeComponent implements OnInit {
  @Input() node: any;
  @Input() depth: number;
  @Output() editDashboard = new EventEmitter<any>();
  @Output() deleteDashboard = new EventEmitter<any>();
  @Input() connectedTo: string[];
  @Output() itemDrop: EventEmitter<CdkDragDrop<any>>;

  constructor(@Inject(DOCUMENT) private document: Document) { this.itemDrop = new EventEmitter(); }

  objectKeys = Object.keys;
  isCollapsed = true;

  ngOnInit() {
    console.log(this.node);
    this.isCollapsed = true;
  }

  expandCollapsedToggle(node: any) {
    if (node.children && Object.keys(node.children).length > 0) {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  editDashboardClicked(dashboard) {
    this.editDashboard.emit(dashboard);
  }

  deleteDashboardClicked(dashboard) {
    this.deleteDashboard.emit(dashboard);
  }

  public onDragDrop(event: CdkDragDrop<any, any>): void {
    this.itemDrop.emit(event);
  }
}
