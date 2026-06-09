import type { ComponentType } from 'react';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  colors: string[];
  badge?: string;
  description?: string;
}

export interface Feature {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warm';
