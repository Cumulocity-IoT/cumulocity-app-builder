import { Component, OnInit } from '@angular/core';
import { DroppedFile } from '@c8y/ngx-components';
import { ImportAssetsService } from './import-assets.service';
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { Subject } from 'rxjs/internal/Subject';


@Component({
    selector: 'c8y-import-assets',
    templateUrl: 'import-assets.component.html'
})

export class ImportAssetsComponent implements OnInit {

    public onImportFinished: Subject<boolean>;

    public isLoading = false;

    file: DroppedFile;

    constructor(private modalRef: BsModalRef, private importAssetsService: ImportAssetsService) {
        this.onImportFinished = new Subject();
    }

    ngOnInit() { }

    public processFile(files: DroppedFile[]): void {
        if (!files || files.length === 0) {
            this.file = null;
            return;
        }

        this.file = files[0];
    }

    public async importCSV(): Promise<void> {
        if (!this.file) {
            throw new Error('no file selected');
        }

        this.isLoading = true;

        await this.importAssetsService.importAssetFromCSV(this.file);
        this.onImportFinished.next();
        this.closeDialog();
    }

    public isFileSelected(): boolean {
        return !!this.file;
    }

    public closeDialog(): void {
        this.modalRef.hide();
    }
}