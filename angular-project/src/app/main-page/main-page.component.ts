import { Component } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent {

  constructor(private router: Router) { }

  navigateToBotPage() {
    this.router.navigate(['/VsPC']);
  }

  navigateToPlayerPage() {
    this.router.navigate(['/VsPlayer']);
  }
}
