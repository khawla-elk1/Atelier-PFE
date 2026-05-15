import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DeclarationPannePage } from './declaration-panne.page';

const routes: Routes = [
  {
    path: '',
    component: DeclarationPannePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeclarationPannePageRoutingModule {}
