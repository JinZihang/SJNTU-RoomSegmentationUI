import { Component } from '@angular/core';
import { Line } from '../room-segmentation';

@Component({
  selector: 'room-seg-line-table',
  templateUrl: 'room-seg-line-table.component.html',
  styleUrls: ['room-seg-line-table.component.css']
})
export class RoomSegLineTableComponent {
  lineTableDataSource: Line[];

  displayedColumns: string[] = ['lineIndex', 'firstExtremX', 'firstExtremY', 'secondExtremX', 'secondExtremY'];
}