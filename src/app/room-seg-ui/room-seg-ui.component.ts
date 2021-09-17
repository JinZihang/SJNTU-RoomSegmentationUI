import { Component, AfterViewInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import linesetData from '../../assets/mock-lineset.json';

const CanvasSideLength = 600;

@Component({
  selector: 'room-segmentation-ui',
  templateUrl: './room-seg-ui.component.html',
  styleUrls: ['./room-seg-ui.component.css']
})
export class RoomSegUIComponent implements AfterViewInit {
  // Change to @Input after completing the UI
  imageSrc = '/assets/mock-image.png';
  linesets = linesetData.Linesets;

  imageDim: number;
  extendedLinesets: any = [];

  @ViewChild('dimContainer') dimContainerElement: ElementRef;
  @ViewChild('roomTopViewImage') imageElement: ElementRef;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit() {}

  public roomImgOnLoad(): void {
    this.resizeDimContainer()
    this.extendLineSegments();
  }

  // Resize the dimContainerElement according to the original image dimension.
  private resizeDimContainer(): void {
    let imgNaturalHeight = (this.imageElement.nativeElement as HTMLImageElement).naturalHeight;
    let imgNaturalWidth = (this.imageElement.nativeElement as HTMLImageElement).naturalWidth;
    this.imageDim = imgNaturalHeight / imgNaturalWidth;

    if (this.imageDim > 1) {
      let width = String(100/this.imageDim) + '%';
      let leftMargin = String(0.5*(100 - 100/this.imageDim)) + '%';

      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'height', '100%');
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'width', width);
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'margin-left', leftMargin);
    } else {
      let height = String(100*this.imageDim) + '%';
      let topMargin = String(0.5*(100 - 100*this.imageDim)) + '%';

      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'width', '100%');
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'height', height);
      this.renderer.setStyle(this.dimContainerElement.nativeElement, 'margin-top', topMargin);
    }

    this.adjustLinesetCoordinates(imgNaturalHeight, imgNaturalWidth);
  }

  // Adjust linesets' coordinates according to the canvas dimension.
  private adjustLinesetCoordinates(imgNaturalHeight: number, imgNaturalWidth: number): void {
    if (this.imageDim > 1) {
      for (let i=0; i<this.linesets.length; i++) {
        this.linesets[i][0] = (this.linesets[i][0] / imgNaturalWidth) * CanvasSideLength/this.imageDim;
        this.linesets[i][1] = (this.linesets[i][1] / imgNaturalHeight) * CanvasSideLength;
        this.linesets[i][2] = (this.linesets[i][2] / imgNaturalWidth) * CanvasSideLength/this.imageDim;
        this.linesets[i][3] = (this.linesets[i][3] / imgNaturalHeight) * CanvasSideLength;
      }
    } else {
      for (let i=0; i<this.linesets.length; i++) {
        this.linesets[i][0] = (this.linesets[i][0] / imgNaturalWidth) * CanvasSideLength;
        this.linesets[i][1] = (this.linesets[i][1] / imgNaturalHeight) * CanvasSideLength*this.imageDim;
        this.linesets[i][2] = (this.linesets[i][2] / imgNaturalWidth) * CanvasSideLength;
        this.linesets[i][3] = (this.linesets[i][3] / imgNaturalHeight) * CanvasSideLength*this.imageDim;
      }
    }
  }

  private extendLineSegments(): void {
    for (let i=0; i<this.linesets.length; i++) {
      let x1 = this.linesets[i][0];
      let y1 = this.linesets[i][1];
      let x2 = this.linesets[i][2];
      let y2 = this.linesets[i][3];

      let extendedLine: any = [];  // Equation of the line is 'y = (x-x1) * (y1-y2)/(x1-x2) + y1'.

      // Find the 1st point.
      let val1 = x1 * (y2-y1)/(x1-x2) + y1;
      val1 > 0 ? extendedLine.push(0, val1) : extendedLine.push((x2*y1-x1*y2) / (y1-y2), 0);
      
      // Find the 2nd point.
      if (this.imageDim > 1) {
        let val2 = (CanvasSideLength/this.imageDim-x1) * (y1-y2)/(x1-x2) + y1;
        val2 < CanvasSideLength ? extendedLine.push(CanvasSideLength/this.imageDim, val2) 
                                : extendedLine.push((CanvasSideLength*(x1-x2)-x1*y2+x2*y1) / (y1-y2), CanvasSideLength);
      } else {
        let val2 = (CanvasSideLength-x1)*(y1-y2) / (x1-x2) + y1;
        val2 < CanvasSideLength*this.imageDim ? extendedLine.push(CanvasSideLength, val2) 
                                              : extendedLine.push((CanvasSideLength*this.imageDim*(x1- 2)-x1*y2+x2*y1) / (y1-y2), CanvasSideLength*this.imageDim);
      }
      
      this.extendedLinesets.push(extendedLine);
    }
  }

  segAdd(): void {}
  segRemove(): void {}
  segConfirm(): void {}
}