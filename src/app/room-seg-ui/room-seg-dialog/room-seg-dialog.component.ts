import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'room-seg-dialog',
    templateUrl: 'room-seg-dialog.html',
    styleUrls: ['room-seg-dialog.css']
})
export class RoomSegDialog implements OnInit {
    constructor(@Inject(MAT_DIALOG_DATA) data: any) {}

    ngOnInit() {}
}