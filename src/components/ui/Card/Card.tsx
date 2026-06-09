import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import './Card.css';

interface CardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

const Card = ({ children, className = '', hover = true, ...props }: CardProps) => {
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: hover ? { y: -8 } : {},
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={{ duration: 0.3 }}
      className={`card ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;