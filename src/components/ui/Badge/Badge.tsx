import { ReactNode } from 'react';
import { BadgeVariant } from '../../../types';
import './Badge.css';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const Badge = ({ children, variant = 'primary', className = '' }: BadgeProps) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;