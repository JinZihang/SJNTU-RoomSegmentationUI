import { Component } from '@angular/core';
import { LineSetEditHistory } from '../room-segmentation';

@Component({
  selector: 'room-seg-history',
  templateUrl: 'room-seg-history.component.html',
  styleUrls: ['room-seg-history.component.css']
})
export class RoomSegHistoryComponent {
  historyTableDataSource: LineSetEditHistory[] = [
    {editIndex: 1, editName: 'Add'},
    {editIndex: 2, editName: 'Remove'}
  ];

  displayedColumns: string[] = ['edit-index', 'edit-name'];
}