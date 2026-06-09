import { motion } from 'framer-motion';
import { ShoppingCart, Heart } from 'lucide-react';
import Card from '../ui/Card/Card';
import Badge from '../ui/Badge/Badge';
import Button from '../ui/Button/Button';
import { Product } from '../../types';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Card className="product-card">
      <div className="product-image-container">
        {product.badge && (
          <Badge variant="primary" className="product-badge">
            {product.badge}
          </Badge>
        )}
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="product-favorite"
        >
          <Heart className="icon" />
        </motion.button>

        <img
          src={product.image}
          alt={product.name}
          className="product-image"
        />
      </div>

      <div className="product-info">
        <div className="product-colors">
          {product.colors.map((color, index) => (
            <button
              key={index}
              className="product-color"
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>

        <h3 className="product-name line-clamp-2">
          {product.name}
        </h3>
        
        <p className="product-category line-clamp-1">
          {product.category}
        </p>

        <div className="product-footer">
          <div>
            <span className="product-price">
              {product.price} EGP
            </span>
            {product.oldPrice && (
              <span className="product-old-price">
                {product.oldPrice} EGP
              </span>
            )}
          </div>

          <motion.button
  whileTap={{ scale: 0.9 }}
  className="product-add-btn"
  aria-label="Add to cart"
>
  <ShoppingCart className="icon" />
</motion.button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
