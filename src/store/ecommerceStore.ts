// E-commerce Store — 4.5 E-commerce (UI Shell)
import { create } from "zustand";
import type { Product, CartItem } from "../types/canvas";

export type PaymentProvider = "none" | "stripe" | "paypal";

interface EcommerceStoreState {
  products: Product[];
  cart: CartItem[];
  isEcommercePanelOpen: boolean;
  paymentProvider: PaymentProvider;
  stripePublicKey: string;
  currency: string;
  isCartOpen: boolean;
}

interface EcommerceStoreActions {
  openEcommercePanel: () => void;
  closeEcommercePanel: () => void;
  addProduct: (product: Omit<Product, "id">) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addToCart: (productId: string, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  setPaymentProvider: (provider: PaymentProvider) => void;
  setStripePublicKey: (key: string) => void;
  setCurrency: (currency: string) => void;
  openCart: () => void;
  closeCart: () => void;
  loadProducts: (products: Product[]) => void;
}

type EcommerceStore = EcommerceStoreState & EcommerceStoreActions;

// Default demo products
const DEMO_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Premium Design Template",
    description: "Professional website design template with responsive layouts and modern aesthetics.",
    price: 49.99,
    currency: "USD",
    images: [],
    category: "Templates",
    inStock: true,
    variants: [
      { id: "v1", name: "Personal License", price: 49.99, inStock: true },
      { id: "v2", name: "Commercial License", price: 99.99, inStock: true },
    ],
  },
  {
    id: "prod-2",
    name: "Icon Pack Pro",
    description: "500+ handcrafted SVG icons for your design projects.",
    price: 29.99,
    currency: "USD",
    images: [],
    category: "Assets",
    inStock: true,
  },
  {
    id: "prod-3",
    name: "UI Component Kit",
    description: "Complete set of reusable UI components for rapid prototyping.",
    price: 79.99,
    currency: "USD",
    images: [],
    category: "Components",
    inStock: true,
    variants: [
      { id: "v3", name: "Basic", price: 79.99, inStock: true },
      { id: "v4", name: "Pro", price: 149.99, inStock: true },
      { id: "v5", name: "Enterprise", price: 299.99, inStock: false },
    ],
  },
  {
    id: "prod-4",
    name: "Custom Font Bundle",
    description: "A curated collection of 10 premium fonts for web and print.",
    price: 39.99,
    currency: "USD",
    images: [],
    category: "Fonts",
    inStock: false,
  },
];

export const useEcommerceStore = create<EcommerceStore>((set, get) => ({
  products: DEMO_PRODUCTS,
  cart: [],
  isEcommercePanelOpen: false,
  paymentProvider: "none",
  stripePublicKey: "",
  currency: "USD",
  isCartOpen: false,

  openEcommercePanel: () => set({ isEcommercePanelOpen: true }),
  closeEcommercePanel: () => set({ isEcommercePanelOpen: false }),

  addProduct: (product) => {
    const newProduct: Product = { ...product, id: crypto.randomUUID() };
    set((s) => ({ products: [...s.products, newProduct] }));
    return newProduct;
  },

  updateProduct: (id, updates) => {
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  deleteProduct: (id) => {
    set((s) => ({
      products: s.products.filter((p) => p.id !== id),
      cart: s.cart.filter((c) => c.productId !== id),
    }));
  },

  addToCart: (productId, variantId) => {
    set((s) => {
      const existing = s.cart.find(
        (c) => c.productId === productId && c.variantId === variantId
      );
      if (existing) {
        return {
          cart: s.cart.map((c) =>
            c.productId === productId && c.variantId === variantId
              ? { ...c, quantity: c.quantity + 1 }
              : c
          ),
        };
      }
      return { cart: [...s.cart, { productId, variantId, quantity: 1 }] };
    });
  },

  removeFromCart: (productId, variantId) => {
    set((s) => ({
      cart: s.cart.filter(
        (c) => !(c.productId === productId && c.variantId === variantId)
      ),
    }));
  },

  updateCartQuantity: (productId, quantity, variantId) => {
    if (quantity <= 0) {
      get().removeFromCart(productId, variantId);
      return;
    }
    set((s) => ({
      cart: s.cart.map((c) =>
        c.productId === productId && c.variantId === variantId
          ? { ...c, quantity }
          : c
      ),
    }));
  },

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    const { cart, products } = get();
    return cart.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return total;
      const variant = product.variants?.find((v) => v.id === item.variantId);
      const price = variant?.price ?? product.price;
      return total + price * item.quantity;
    }, 0);
  },

  getCartItemCount: () => {
    return get().cart.reduce((count, item) => count + item.quantity, 0);
  },

  setPaymentProvider: (provider) => set({ paymentProvider: provider }),
  setStripePublicKey: (key) => set({ stripePublicKey: key }),
  setCurrency: (currency) => set({ currency }),
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  loadProducts: (products) => set({ products }),
}));
