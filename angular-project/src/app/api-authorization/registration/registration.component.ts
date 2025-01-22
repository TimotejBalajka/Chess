import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthenticationService } from '../authentication.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { HttpErrorResponse } from '@angular/common/http';
import { equalValuesValidator, passwordStrengthValidator } from '../password-validators';
import { Router } from '@angular/router';
import { RecaptchaModule } from 'ng-recaptcha';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatIcon,
    MatIconButton,
    MatButton,
    RecaptchaModule
  ],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent implements OnInit {
  authService = inject(AuthenticationService);
  private router = inject(Router);

  registerForm: FormGroup;
  captchaToken = signal<string>(undefined);
  siteKey = '6Le_yL8qAAAAAOKmiBD5O8Jh8bkZJYRXRnX70IVf';

  ngOnInit(): void {
    this.registerForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', passwordStrengthValidator()),
      confirmPassword: new FormControl('', equalValuesValidator('password'))
    });
  }

  register() {
    if(this.registerForm.valid) {
      this.authService.registerUser({...this.registerForm.value, captchaToken: this.captchaToken()}).subscribe({
        next: () => {
          console.log('Registration successful!');
          this.router.navigate(['/']);
        },
        error: (err: HttpErrorResponse) => console.log('Oops, something went wrong!', err)
      });
    }
  }

  onCaptchaResolved(token: string) {
    this.captchaToken.set(token);
  }
}
