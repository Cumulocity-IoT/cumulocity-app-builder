import { Component, EventEmitter, ViewEncapsulation } from "@angular/core";
import { LoginService } from "@c8y/ngx-components";
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'alert-message-modal',
    templateUrl: './alert-message-modal.component.html',
    // styleUrls: [''],
})
export class AlertMessageModalComponent {

    message: any;
    public event: EventEmitter<any> = new EventEmitter();
    constructor(public bsModalRef: BsModalRef, private loginService: LoginService) { }
    colorStatusClass() {
        switch (this.message.type) {
            case 'danger':
                return 'alert-danger'
            case 'warning':
                return 'alert-warning'
            default:
                return 'alert-info'
        }
    }

    confirm() {
        this.event.emit({ isConfirm: true });
        this.bsModalRef.hide();
    }

    dismiss() {
        this.event.emit({ isConfirm: false });
        this.bsModalRef.hide();
    }

    logout() {
        this.loginService.logout();
    }
}