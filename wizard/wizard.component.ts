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

import {
    AfterContentInit,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    Input,
    OnDestroy,
    QueryList
} from "@angular/core";
import {WizardStepComponent} from "./wizard-step.component";
import {BehaviorSubject, Subscription} from "rxjs";
import {AsyncInput} from "@ng-reactive/async-input";
import {filter, startWith} from "rxjs/operators";

@Component({
    selector: 'wizard',
    template: `<ng-content></ng-content>`
})
export class WizardComponent implements OnDestroy, AfterContentInit  {
    private activeStep = new BehaviorSubject<WizardStepComponent | undefined>(undefined);
    private stepsById = new Map<string, WizardStepComponent>();
    private subscriptions = new Subscription();
    @ContentChildren(WizardStepComponent) public steps: QueryList<WizardStepComponent>;

    @Input() public activeStepId: string;
    @AsyncInput() private activeStepId$ = new BehaviorSubject<string>('');

    constructor(private changeDetector: ChangeDetectorRef) {
        this.subscriptions.add(
            this.activeStepId$
                .pipe(filter(() => this.steps != undefined))
                .subscribe(stepId => this._selectStep(stepId)));
        this.subscriptions.add(
            this.activeStep
                .subscribe(activeStep => {
                    [...this.stepsById.values()].filter(step => step != activeStep).forEach(step => step.hidden = true);
                    if (activeStep != undefined) {
                        activeStep.hidden = false;
                    }
                })
        );
    }

    ngAfterContentInit(): void {
        this.subscriptions.add(this.steps.changes.pipe(startWith({})).subscribe(() => {
            this.stepsById = this.steps.reduce((stepsById, step) => {
                stepsById.set(step.stepId, step);
                return stepsById;
            }, new Map<string, WizardStepComponent>());

            this._selectStep(this.activeStepId);
        }));
    }

    private _selectStep(stepId: string) {
        if (this.stepsById.has(stepId)) {
            this.activeStep.next(this.stepsById.get(stepId));
        } else {
            console.warn(`Could not find step with id: ${stepId}`);
            this.activeStep.next(this.steps.first);
        }
    }

    public selectStep(stepId: string) {
        this.activeStepId = stepId;
        this.activeStepId$.next(stepId);
        this.changeDetector.markForCheck();
        this.changeDetector.detectChanges();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }
}