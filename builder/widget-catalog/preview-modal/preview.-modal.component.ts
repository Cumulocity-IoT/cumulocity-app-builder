import { Component, OnInit} from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { interval } from 'rxjs';

@Component({
    selector: 'preview-modal',
    templateUrl: './preview-modal.component.html',
})
export class previewModalComponent implements OnInit{

    imageURL: any;
    constructor(public bsModalRef: BsModalRef) {}
    showSpinner = true;
    ngOnInit() {
        const waitforImage = interval(200);
        const waitforImageSub = waitforImage.subscribe(async val => {
            this.showSpinner = false;
            waitforImageSub.unsubscribe();
        });
    }
    dismiss() {
        this.bsModalRef.hide();
    }

}