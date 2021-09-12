import { Directive, AfterViewInit, Input, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '#lineset-canvas',
})
export class LineCanvas implements AfterViewInit {
  @Input() canvasDim: any;

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    if (this.canvasDim >= 1) {
      let width = String(100/parseFloat(this.canvasDim)) + '%';

      this.renderer.setStyle(this.elementRef.nativeElement, 'height', '100%');
      this.renderer.setStyle(this.elementRef.nativeElement, 'width', width);
    } else {
      let height = String(100*parseFloat(this.canvasDim)) + '%';

      this.renderer.setStyle(this.elementRef.nativeElement, 'width', '100%');
      this.renderer.setStyle(this.elementRef.nativeElement, 'height', height);
    }
  }
}