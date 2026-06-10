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
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, chosenColor?: CartItem['selected_color']) => void;
  updateQuantity: (id: number, amount: number, selected_color?: CartItem['selected_color']) => void;
  removeFromCart: (id: number, selected_color?: CartItem['selected_color']) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&q=80';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // 1. Initial State Load with Fallback Error Protection Block
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) return [];

      const parsedCart = JSON.parse(savedCart);
      if (!Array.isArray(parsedCart)) return [];

      // Clean old object array formats down to clean flat string paths safely on boot
      return parsedCart.map((item: any) => {
        let flatImage = FALLBACK_IMAGE;
        if (typeof item.image === 'string') {
          flatImage = item.image;
        } else if (item.product_images && Array.isArray(item.product_images) && item.product_images[0]) {
          flatImage = item.product_images[0].image_url || flatImage;
        } else if (item.image_url) {
          flatImage = item.image_url;
        }

        return {
          ...item,
          image: flatImage
        };
      });
    } catch (error) {
      console.error("Failed parsing cart out of localStorage:", error);
      return [];
    }
  });

  // 2. Sync State modifications into cache automatically
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: any, chosenColor: CartItem['selected_color'] = null) => {
    setCart((prev) => {
      // Extract properties safely whether passed a raw database item or a pre-mapped catalog item
      const productId = product.id;
      const nameEn = product.name_en;
      const nameAr = product.name_ar;
      
      const activePrice = product.discount_price !== undefined 
        ? (product.discount_price ?? product.price) 
        : product.price;

      // CRITICAL SAFEGUARD: Safe extraction check avoiding '0' reading runtime crash error
      let imgUrl = FALLBACK_IMAGE;
      if (typeof product.image === 'string') {
        imgUrl = product.image;
      } else if (product.product_images && Array.isArray(product.product_images) && product.product_images[0]) {
        imgUrl = product.product_images[0].image_url || imgUrl;
      } else if (product.image_url) {
        imgUrl = product.image_url;
      }

      // Extract the selected color attribute variant data safely
      const targetColor = chosenColor || product.selected_color || null;

      // Match item uniqueness by both ID and its variant color choice
      const existingIndex = prev.findIndex((item) => 
        item.id === productId && 
        item.selected_color?.color_code === targetColor?.color_code
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
          selected_color: targetColor
        }
      ];
    });
  };

  const updateQuantity = (id: number, amount: number, selected_color?: CartItem['selected_color']) => {
    setCart(prevCart =>
      prevCart.map(item => {
        const matchId = item.id === id;
        const matchColor = item.selected_color?.color_code === selected_color?.color_code;
        
        if (matchId && matchColor) {
          const newQty = item.quantity + amount;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: number, selected_color?: CartItem['selected_color']) => {
    setCart(prevCart =>
      prevCart.filter(item => 
        !(item.id === id && item.selected_color?.color_code === selected_color?.color_code)
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