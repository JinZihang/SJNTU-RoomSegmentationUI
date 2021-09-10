import { Component, OnInit } from '@angular/core';
import{ RoomSegmemtationDataSource } from '../room-seg-data/room-seg-data-source';

@Component({
  selector: 'room-segmentation-ui',
  templateUrl: './room-seg-ui.component.html',
  styleUrls: ['./room-seg-ui.component.css']
})
export class RoomSegUIComponent implements OnInit {
  segDataSource = RoomSegmemtationDataSource

  constructor() {}

  ngOnInit() {}
}