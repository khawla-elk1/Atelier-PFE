import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeclarationPannePage } from './declaration-panne.page';

describe('DeclarationPannePage', () => {
  let component: DeclarationPannePage;
  let fixture: ComponentFixture<DeclarationPannePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DeclarationPannePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
