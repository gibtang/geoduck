import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function getCurrentUser(): Promise<any> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}
