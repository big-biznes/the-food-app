import React, { createContext, useContext, useState } from 'react';

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-allergy'
  | 'halal'
  | 'kosher';

export type Goal = 'lose' | 'gain' | 'maintain';
export type Gender = 'male' | 'female' | 'other';

export type UserProfile = {
  name: string;
  email: string;
  goal: Goal;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  restrictions: DietaryRestriction[];
  eatingOutDay: string;
};

type AuthContextType = {
  isLoggedIn: boolean;
  user: UserProfile | null;
  pendingEmail: string;
  register: (email: string, password: string) => void;
  login: (email: string, password: string) => void;
  completeProfile: (profile: Omit<UserProfile, 'email'>) => void;
  updateProfile: (updates: Partial<Omit<UserProfile, 'email'>>) => void;
  devLogin: (profile: UserProfile) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');

  function register(email: string, _password: string) {
    setPendingEmail(email);
  }

  function login(_email: string, _password: string) {
    // TODO: real auth
    setIsLoggedIn(true);
  }

  function completeProfile(profile: Omit<UserProfile, 'email'>) {
    setUser({ ...profile, email: pendingEmail });
    setIsLoggedIn(true);
  }

  function updateProfile(updates: Partial<Omit<UserProfile, 'email'>>) {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }

  function devLogin(profile: UserProfile) {
    setUser(profile);
    setIsLoggedIn(true);
  }

  function logout() {
    setIsLoggedIn(false);
    setUser(null);
    setPendingEmail('');
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, pendingEmail, register, login, completeProfile, updateProfile, devLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
