import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { Line } from '../room-segmentation';

@Component({
  selector: 'room-seg-line-table',
  templateUrl: 'room-seg-line-table.component.html',
  styleUrls: ['room-seg-line-table.component.css']
})
export class RoomSegLineTableComponent implements OnChanges {
  @Input() lineSet: number[][];
  @Input() imgScale: number[];
  @Input() canvasSideLength: number;
  @Input() updateTriggerer: string;

  @Output() selectLineIndex = new EventEmitter<number>();

  lineTableDataSource: Line[];
  displayedColumns: string[] = ['lineIndex', 'firstExtremX', 'firstExtremY', 'secondExtremX', 'secondExtremY'];

  ngOnChanges() {
    this.updateLineTable();
  }

  private updateLineTable() {
    this.lineTableDataSource = [];

    if (this.imgScale !== undefined) {
      if (this.imgScale[0] > this.imgScale[1]) {
        for (let i=0; i<this.lineSet.length; i++) {
          const x1 = this.lineSet[i][0] / this.imgScale[0] * this.canvasSideLength;
          const y1 = this.lineSet[i][1] / this.imgScale[0] * this.canvasSideLength;
          const x2 = this.lineSet[i][2] / this.imgScale[0] * this.canvasSideLength;
          const y2 = this.lineSet[i][3] / this.imgScale[0] * this.canvasSideLength;

          this.lineTableDataSource.push({
            lineIndex: i,
            firstExtremX: Number(x1.toFixed(0)),
            firstExtremY: Number(y1.toFixed(0)),
            secondExtremX: Number(x2.toFixed(0)),
            secondExtremY: Number(y2.toFixed(0))
          });
        }
      } else {
        for (let i=0; i<this.lineSet.length; i++) {
          const x1 = this.lineSet[i][0] / this.imgScale[1] * this.canvasSideLength;
          const y1 = this.lineSet[i][1] / this.imgScale[1] * this.canvasSideLength;
          const x2 = this.lineSet[i][2] / this.imgScale[1] * this.canvasSideLength;
          const y2 = this.lineSet[i][3] / this.imgScale[1] * this.canvasSideLength;

          this.lineTableDataSource.push({
            lineIndex: i,
            firstExtremX: Number(x1.toFixed(0)),
            firstExtremY: Number(y1.toFixed(0)),
            secondExtremX: Number(x2.toFixed(0)),
            secondExtremY: Number(y2.toFixed(0))
          });
        }
      }  
    }
  }

  public rowSelection(lineIndex?: number) {
      this.selectLineIndex.emit(lineIndex);
  }
}