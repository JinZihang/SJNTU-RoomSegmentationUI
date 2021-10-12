import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatTableModule } from "@angular/material/table";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppComponent } from './app.component';
import { RoomSegUIComponent } from './room-seg-ui/room-seg-ui.component';
import { RoomSegLineTableComponent } from './room-seg-ui/room-seg-line-table/room-seg-line-table.component';
import { RoomSegDisplayComponent } from './room-seg-ui/room-seg-display/room-seg-display.component';
import { RoomSegDialogComponent } from './room-seg-ui/room-seg-dialog/room-seg-dialog.component';
import { RoomSegHistoryTableComponent } from './room-seg-ui/room-seg-history-table/room-seg-history-table.component';

@NgModule({
  declarations: [
    AppComponent,
    RoomSegUIComponent,
    RoomSegLineTableComponent,
    RoomSegDisplayComponent,
    RoomSegDialogComponent,
    RoomSegHistoryTableComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,

    MatTableModule,
    MatToolbarModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatTooltipModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
