import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface CartItem {
  id: number;
  name_en: string;
  name_ar: string;
  price: number;
  image: string;
  quantity: number;
  selected_color?: {
    color_code: string;
    color_name_en: string;
    color_name_ar: string;
  } | null;
  selected_variant?: {
    variant_name_en: string;
    variant_name_ar: string;
  } | null;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, chosenColor?: CartItem['selected_color'], chosenVariant?: CartItem['selected_variant']) => void;
  updateQuantity: (id: number, amount: number, selected_color?: CartItem['selected_color'], selected_variant?: CartItem['selected_variant']) => void;
  removeFromCart: (id: number, selected_color?: CartItem['selected_color'], selected_variant?: CartItem['selected_variant']) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=80';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) return [];
      const parsedCart = JSON.parse(savedCart);
      if (!Array.isArray(parsedCart)) return [];
      return parsedCart.map((item: any) => {
        let flatImage = FALLBACK_IMAGE;
        if (typeof item.image === 'string') {
          flatImage = item.image;
        } else if (item.product_images && Array.isArray(item.product_images) && item.product_images[0]) {
          flatImage = item.product_images[0].image_url || flatImage;
        } else if (item.image_url) {
          flatImage = item.image_url;
        }
        return { ...item, image: flatImage };
      });
    } catch (error) {
      console.error('Failed parsing cart out of localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Unique key for a cart item = id + color code + variant name
  const itemKey = (
    id: number,
    color?: CartItem['selected_color'],
    variant?: CartItem['selected_variant']
  ) => `${id}__${color?.color_code ?? 'no-color'}__${variant?.variant_name_en ?? 'no-variant'}`;

  const addToCart = (
    product: any,
    chosenColor: CartItem['selected_color'] = null,
    chosenVariant: CartItem['selected_variant'] = null
  ) => {
    setCart(prev => {
      const productId = product.id;
      const nameEn = product.name_en;
      const nameAr = product.name_ar;

      const activePrice =
        product.discount_price !== undefined
          ? product.discount_price ?? product.price
          : product.price;

      let imgUrl = FALLBACK_IMAGE;
      if (typeof product.image === 'string') {
        imgUrl = product.image;
      } else if (product.product_images && Array.isArray(product.product_images) && product.product_images[0]) {
        imgUrl = product.product_images[0].image_url || imgUrl;
      } else if (product.image_url) {
        imgUrl = product.image_url;
      }

      const targetColor = chosenColor || product.selected_color || null;
      const targetVariant = chosenVariant || product.selected_variant || null;

      const existingIndex = prev.findIndex(
        item =>
          itemKey(item.id, item.selected_color, item.selected_variant) ===
          itemKey(productId, targetColor, targetVariant)
      );

      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...prev,
        {
          id: productId,
          name_en: nameEn,
          name_ar: nameAr,
          price: Number(activePrice),
          image: imgUrl,
          quantity: 1,
          selected_color: targetColor,
          selected_variant: targetVariant,
        },
      ];
    });
  };

  const updateQuantity = (
    id: number,
    amount: number,
    selected_color?: CartItem['selected_color'],
    selected_variant?: CartItem['selected_variant']
  ) => {
    setCart(prev =>
      prev.map(item => {
        if (
          itemKey(item.id, item.selected_color, item.selected_variant) ===
          itemKey(id, selected_color, selected_variant)
        ) {
          const newQty = item.quantity + amount;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeFromCart = (
    id: number,
    selected_color?: CartItem['selected_color'],
    selected_variant?: CartItem['selected_variant']
  ) => {
    setCart(prev =>
      prev.filter(
        item =>
          itemKey(item.id, item.selected_color, item.selected_variant) !==
          itemKey(id, selected_color, selected_variant)
      )
    );
  };

  const clearCart = () => setCart([]);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};