import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

import { AppComponent } from './app.component';
import { RoomSegUIComponent } from './room-seg-ui/room-seg-ui.component';
import { RoomSegDisplayComponent } from './room-seg-ui/room-seg-display/room-seg-display.component';
import { RoomSegDialog } from './room-seg-ui/room-seg-dialog/room-seg-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    RoomSegUIComponent,
    RoomSegDisplayComponent,
    RoomSegDialog
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatDialogModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
