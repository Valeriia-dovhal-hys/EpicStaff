import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LlmDefaultsComponent } from './llm-defaults.component';

describe('LlmDefaultsComponent', () => {
  let component: LlmDefaultsComponent;
  let fixture: ComponentFixture<LlmDefaultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LlmDefaultsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LlmDefaultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
