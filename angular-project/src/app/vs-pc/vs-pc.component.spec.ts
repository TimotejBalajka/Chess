import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VsPcComponent } from './vs-pc.component';

describe('VsPcComponent', () => {
  let component: VsPcComponent;
  let fixture: ComponentFixture<VsPcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VsPcComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VsPcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
