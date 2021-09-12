import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { RoomSegUIComponent } from './room-seg-ui/room-seg-ui.component';
import { RoomImage } from './room-seg-ui/room-image-resize.component';
import { RoomSegLineComponent } from './room-seg-line/room-seg-line.component';
import { LineCanvas } from './room-seg-line/lineset-canvas-resize.component';

@NgModule({
  declarations: [
    AppComponent,
    RoomSegUIComponent,
    RoomImage,
    RoomSegLineComponent,
    LineCanvas
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
