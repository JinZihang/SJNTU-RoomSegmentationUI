import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomSegEditorComponent } from './room-seg-editor.component';

describe('RoomSegEditorComponent', () => {
  let component: RoomSegEditorComponent;
  let fixture: ComponentFixture<RoomSegEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoomSegEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomSegEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
