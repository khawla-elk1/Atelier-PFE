import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DeclarationPannePageRoutingModule } from './declaration-panne-routing.module';

import { DeclarationPannePage } from './declaration-panne.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DeclarationPannePageRoutingModule
  ],
  declarations: [DeclarationPannePage]
})
export class DeclarationPannePageModule {}
