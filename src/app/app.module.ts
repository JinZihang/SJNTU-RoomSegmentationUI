import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { AppComponent } from './app.component';
import { RoomSegUIComponent } from './room-seg-ui/room-seg-ui.component';
import { RoomSegDialog } from './room-seg-ui/room-seg-dialog/room-seg-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    RoomSegUIComponent,
    RoomSegDialog
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatDialogModule,
    MatButtonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
