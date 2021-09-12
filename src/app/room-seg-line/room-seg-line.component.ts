import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'room-segmentation-line',
  templateUrl: './room-seg-line.component.html',
  styleUrls: ['./room-seg-line.component.css']
})
export class RoomSegLineComponent implements OnInit {
  constructor() {}

  ngOnInit() {}

  @Input() linesets?: any;
}