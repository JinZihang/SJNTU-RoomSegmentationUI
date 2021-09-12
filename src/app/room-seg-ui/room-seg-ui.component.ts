import { Component, AfterViewInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import linesetData from '../../assets/mock-lineset.json';

// class ImageDimension {}

@Component({
  selector: 'room-segmentation-ui',
  templateUrl: './room-seg-ui.component.html',
  styleUrls: ['./room-seg-ui.component.css']
})
export class RoomSegUIComponent implements AfterViewInit {
  // Change to @Input after completing the UI
  imageSrc = '/assets/mock-image.png';
  linesets = linesetData.Linesets;

  @ViewChild('dimContainer') dimContainerElement: ElementRef;
  @ViewChild('roomTopViewImage') imageElement: ElementRef;
  
  imageDim: number;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit() {}

  roomImgOnLoad() {
    let imgNaturalHeight = (this.imageElement.nativeElement as HTMLImageElement).naturalHeight;
    let imgNaturalWidth = (this.imageElement.nativeElement as HTMLImageElement).naturalWidth;
    this.imageDim = imgNaturalHeight / imgNaturalWidth;

    // Resize the dimContainerElement according to the original image dimension.
    if (this.imageDim >= 1) {
      let width = String(100/this.imageDim) + '%';
      let leftMargin = String(0.5*(100 - 100/this.imageDim)) + '%';

      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'height', '100%');
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'width', width);
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'margin-left', leftMargin);
    } else {
      let height = String(100 * this.imageDim) + '%';
      let topMargin = String(0.5*(100 - 100*this.imageDim)) + '%';

      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'width', '100%');
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'height', height);
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'margin-top', topMargin);
    }
  }

  segAdd(): void {}
  segRemove(): void {}
  segConfirm(): void {}
}