// Make sure this file is at: src/app/services/notifications/toast.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts = new BehaviorSubject<ToastMessage[]>([]);
  private counter = 0;

  get toasts$(): Observable<ToastMessage[]> {
    return this.toasts.asObservable();
  }

  show(
    message: string,
    type: ToastType = 'info',
    duration: number = 3000
  ): void {
    console.log(`Showing toast: ${message} (${type})`); // Add logging
    const id = this.counter++;

    // Add new toast to the list
    const currentToasts = this.toasts.value;
    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration,
    };

    this.toasts.next([...currentToasts, newToast]);

    // Remove toast after duration
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id: number): void {
    console.log(`Removing toast with id: ${id}`); // Add logging
    const currentToasts = this.toasts.value;
    this.toasts.next(currentToasts.filter((toast) => toast.id !== id));
  }

  success(message: string, duration: number = 5000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration: number = 7000): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration: number = 6000): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration: number = 5000): void {
    this.show(message, 'info', duration);
  }
}
