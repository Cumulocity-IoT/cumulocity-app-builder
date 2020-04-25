import {Injectable} from "@angular/core";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {InstallWidgetModalComponent} from "./install-widget-modal.component";

@Injectable({providedIn: 'root'})
export class WidgetInstallerService {
    bsModalRef: BsModalRef;

    constructor(private modalService: BsModalService) {}

    installWidget() {
        this.bsModalRef = this.modalService.show(InstallWidgetModalComponent, { class: 'c8y-wizard', initialState: { } })
    }
}
