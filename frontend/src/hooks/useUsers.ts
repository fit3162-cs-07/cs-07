import { useContext } from 'react';
import { UsersContext } from '../contexts/UsersContext';

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsers must be used within UsersProvider');
  return ctx;
}
