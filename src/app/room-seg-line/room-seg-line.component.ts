import { Component, OnInit } from '@angular/core';
import{ RoomSegmemtationDataSource } from '../room-seg-data/room-seg-data-source';

// import npyjs;

@Component({
  selector: 'room-segmentation-line',
  templateUrl: './room-seg-line.component.html',
  styleUrls: ['./room-seg-line.component.css']
})
export class RoomSegLineComponent implements OnInit {
  segDataSource = RoomSegmemtationDataSource

  constructor() {}

  ngOnInit() {}
}