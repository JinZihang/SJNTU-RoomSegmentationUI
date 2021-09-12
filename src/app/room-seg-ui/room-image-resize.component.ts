import { Directive, AfterViewInit, Input, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '#room-top-view-image',
})
export class RoomImage implements AfterViewInit {
  @Input() imageDim: any;

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
        if (this.imageDim >= 1) {
        let width = String(100/parseFloat(this.imageDim)) + '%';

        this.renderer.setStyle(this.elementRef.nativeElement, 'height', '100%');
        this.renderer.setStyle(this.elementRef.nativeElement, 'width', width);
        } else {
        let height = String(100*parseFloat(this.imageDim)) + '%';

        this.renderer.setStyle(this.elementRef.nativeElement, 'width', '100%');
        this.renderer.setStyle(this.elementRef.nativeElement, 'height', height);
        }
    }
}