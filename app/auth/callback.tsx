import { Redirect } from 'expo-router';

/**
 * Google sign-in returns to thefoodapp://auth/callback. The sign-in itself is finished in
 * AuthContext.signInWithGoogle; this route only stops the deep link landing on "not found".
 */
export default function AuthCallback() {
  return <Redirect href="/" />;
}
