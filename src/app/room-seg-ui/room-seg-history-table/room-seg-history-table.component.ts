import { Component } from '@angular/core';
import { LineSetEditHistory } from '../room-segmentation';

@Component({
  selector: 'room-seg-history-table',
  templateUrl: 'room-seg-history-table.component.html',
  styleUrls: ['room-seg-history-table.component.css']
})
export class RoomSegHistoryTableComponent {
  historyTableDataSource: LineSetEditHistory[] = [
    {editIndex: 1, editName: 'Remove'},
    {editIndex: 2, editName: 'Remove'},
    {editIndex: 3, editName: 'Remove'},
    {editIndex: 4, editName: 'Add'},
    {editIndex: 5, editName: 'Add'},
    {editIndex: 6, editName: 'Add'},
    {editIndex: 7, editName: 'Add'},
    {editIndex: 8, editName: 'Remove'},
    {editIndex: 9, editName: 'Remove'},
    {editIndex: 10, editName: 'Remove'},
    {editIndex: 11, editName: 'Edit'},
    {editIndex: 12, editName: 'Edit'},
    {editIndex: 13, editName: 'Edit'},
    {editIndex: 14, editName: 'Add'},
    {editIndex: 15, editName: 'Add'},
    {editIndex: 16, editName: 'Remove'},
    {editIndex: 17, editName: 'Remove'},
    {editIndex: 18, editName: 'Add'},
    {editIndex: 19, editName: 'Add'},
    {editIndex: 20, editName: 'Remove'},
    {editIndex: 21, editName: 'Edit'},
    {editIndex: 22, editName: 'Edit'},
    {editIndex: 23, editName: 'Remove'},
    {editIndex: 24, editName: 'Remove'},
    {editIndex: 25, editName: 'Edit'}
  ];

  displayedColumns: string[] = ['edit-index', 'edit-name'];
}