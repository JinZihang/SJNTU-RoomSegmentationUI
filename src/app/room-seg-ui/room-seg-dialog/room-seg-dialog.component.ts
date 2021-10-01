import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'room-seg-dialog',
    templateUrl: 'room-seg-dialog.html',
    styleUrls: ['room-seg-dialog.css']
})
export class RoomSegDialogComponent{
    action: string;
    title: string;
    content: string;
    lineIndex: number;

    constructor(@Inject(MAT_DIALOG_DATA) data: any) {
        this.action = data.action;
        this.title = data.title;
        this.content = data.content;
        this.lineIndex = data.lineIndex;
    }
}