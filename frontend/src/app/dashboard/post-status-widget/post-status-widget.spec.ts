import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostStatusWidget } from './post-status-widget';

describe('PostStatusWidget', () => {
  let component: PostStatusWidget;
  let fixture: ComponentFixture<PostStatusWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostStatusWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostStatusWidget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
