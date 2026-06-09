import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { ButtonVariant, ButtonSize } from '../../../types';
import './Button.css';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  onClick,
  type = 'button',
  disabled = false,
}: ButtonProps) => {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`btn btn-${variant} btn-${size} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default Button;