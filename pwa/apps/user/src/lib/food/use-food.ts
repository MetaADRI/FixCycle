'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  addToFoodCart,
  applyFoodPromo,
  cancelFoodOrder,
  clearFoodCart,
  fetchFoodCart,
  fetchFoodChatHistory,
  fetchFoodCheckout,
  fetchFoodOrderDetail,
  fetchFoodOrders,
  fetchFoodStoreDetails,
  fetchFoodStores,
  placeFoodOrder,
  rateFoodOrder,
  removeFromFoodCart,
  reorderFood,
  sendFoodChatMessage,
  trackFoodOrder,
  updateFoodCart,
} from '@fixcycle/api-client';
import type {
  FoodCart,
  FoodCartItem,
  FoodCategory,
  FoodChatMessage,
  FoodCheckoutResult,
  FoodOrder,
  FoodProduct,
  FoodPromoResult,
  FoodStore,
  FoodStoreDetails,
} from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface FoodStoreDetailsView {
  store: FoodStore | null;
  categories: FoodCategory[];
  products: FoodProduct[];
}

export function useFood() {
  const client = api;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Food home.
  const [stores, setStores] = useState<FoodStore[]>([]);

  // Store menu.
  const [storeDetails, setStoreDetails] = useState<FoodStoreDetailsView | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);

  // Product selection.
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [variantId, setVariantId] = useState<number | string | null>(null);
  const [optionIds, setOptionIds] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Cart.
  const [cart, setCart] = useState<FoodCart>({ products: [], total_items: 0 });
  const [cartOpen, setCartOpen] = useState(false);

  // Promo + checkout.
  const [promo, setPromo] = useState<FoodPromoResult | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<FoodCheckoutResult | null>(null);

  // Orders.
  const [activeOrders, setActiveOrders] = useState<FoodOrder[]>([]);
  const [pastOrders, setPastOrders] = useState<FoodOrder[]>([]);
  const [trackedOrder, setTrackedOrder] = useState<FoodOrder | null>(null);

  // Chat.
  const [chatMessages, setChatMessages] = useState<FoodChatMessage[]>([]);
  const [chatUserName, setChatUserName] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState<string | null>(null);

  // ── Home: load store list ────────────────────────────────────────────────
  const loadStores = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchFoodStores(client);
      setStores(list);
    } catch {
      setError('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  // ── Store menu ───────────────────────────────────────────────────────────
  const openStore = useCallback(async (storeId: number | string) => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const details = await fetchFoodStoreDetails(client, { storeId });
      setStoreDetails(details as FoodStoreDetailsView | null);
      const cats = details?.categories ?? [];
      setSelectedCategory(cats[0] ?? null);
    } catch {
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [client]);

  // ── Product selection ────────────────────────────────────────────────────
  const openProduct = useCallback((p: FoodProduct) => {
    setProduct(p);
    setVariantId(p.variants[0]?.id ?? null);
    setOptionIds([]);
    setQuantity(1);
    setCartOpen(false);
  }, []);

  const toggleOption = useCallback(
    (optionId: number) => {
      setOptionIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
      );
    },
    [],
  );

  // ── Cart ─────────────────────────────────────────────────────────────────
  const refreshCart = useCallback(async () => {
    if (!client) return;
    try {
      const next = await fetchFoodCart(client);
      setCart(next);
      return next;
    } catch {
      return null;
    }
  }, [client]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addCurrentProductToCart = useCallback(async () => {
    if (!client || !product) return;
    setLoading(true);
    setError(null);
    try {
      const next = await addToFoodCart(client, {
        productId: product.id,
        quantity,
        variantId: variantId ?? undefined,
        optionIds,
      });
      setCart(next);
      setCartOpen(true);
    } catch {
      setError('Failed to add to cart');
    } finally {
      setLoading(false);
    }
  }, [client, product, quantity, variantId, optionIds]);

  const addToCartSimple = useCallback(
    async (p: FoodProduct) => {
      if (!client) return;
      try {
        const next = await addToFoodCart(client, {
          productId: p.id,
          quantity: 1,
          variantId: p.variants[0]?.id,
        });
        setCart(next);
      } catch {
        setError('Failed to add to cart');
      }
    },
    [client],
  );

  const addToFoodCartWithSelection = useCallback(
    async (p: FoodProduct, qty: number) => {
      if (!client) return;
      setLoading(true);
      setError(null);
      try {
        const next = await addToFoodCart(client, {
          productId: p.id,
          quantity: qty,
          variantId: variantId ?? undefined,
          optionIds,
        });
        setCart(next);
        setCartOpen(true);
      } catch {
        setError('Failed to add to cart');
      } finally {
        setLoading(false);
      }
    },
    [client, variantId, optionIds],
  );

  const changeQuantity = useCallback(async (item: FoodCartItem, nextQuantity: number) => {
    if (!client) return;
    try {
      if (nextQuantity <= 0) {
        const next = await removeFromFoodCart(client, { cartId: item.cart_id });
        setCart(next);
        return;
      }
      const next = await updateFoodCart(client, { cartId: item.cart_id, quantity: nextQuantity });
      setCart(next);
    } catch {
      // keep cart unchanged
    }
  }, [client]);

  const removeItem = useCallback(
    async (cartId: string) => {
      if (!client) return;
      try {
        const next = await removeFromFoodCart(client, { cartId });
        setCart(next);
      } catch {
        // keep cart unchanged
      }
    },
    [client],
  );

  const emptyCart = useCallback(async () => {
    if (!client) return;
    try {
      const next = await clearFoodCart(client);
      setCart(next);
      setPromo(null);
      setPromoCode('');
      setCheckoutResult(null);
    } catch {
      // keep cart unchanged
    }
  }, [client]);

  const setCartCount = useCallback((count: number) => {
    setCart((prev) => ({ ...prev, total_items: count }));
  }, []);

  // ── Promo ────────────────────────────────────────────────────────────────
  const applyPromo = useCallback(
    async (code: string) => {
      if (!client || !code.trim()) return;
      setError(null);
      try {
        const result = await applyFoodPromo(client, { promoCode: code.trim().toUpperCase() });
        setPromo(result);
        setPromoCode(result.promo_code);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Invalid promo code');
        setPromo(null);
      }
    },
    [client],
  );

  const clearPromo = useCallback(() => {
    setPromo(null);
    setPromoCode('');
    setCheckoutResult(null);
  }, []);

  // ── Checkout ─────────────────────────────────────────────────────────────
  const runCheckout = useCallback(
    async (params: {
      storeId: number | string;
      deliveryMode: number;
      paymentMode: string;
      address: string;
      latitude?: number;
      longitude?: number;
    }) => {
      if (!client) return null;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchFoodCheckout(client, {
          storeId: params.storeId,
          deliveryMode: params.deliveryMode,
          paymentMode: params.paymentMode,
          address: params.address,
          latitude: params.latitude,
          longitude: params.longitude,
          promoCode: promoCode || undefined,
        });
        setCheckoutResult(result);
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to prepare checkout');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client, promoCode],
  );

  const placeOrder = useCallback(
    async (params: {
      checkoutId?: string;
      storeId?: number | string;
      deliveryMode: number;
      paymentMode: string;
      address: string;
      latitude?: number;
      longitude?: number;
    }) => {
      if (!client) return null;
      setLoading(true);
      setError(null);
      try {
        const placed = await placeFoodOrder(client, params);
        setLastPlacedOrderId(placed.id || null);
        setCart((prev) => ({ products: [], total_items: 0 }));
        setPromo(null);
        setPromoCode('');
        setCheckoutResult(null);
        return placed;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to place order');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  // ── Track / orders ───────────────────────────────────────────────────────
  const trackOrder = useCallback(async (orderId: string) => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const order = await trackFoodOrder(client, { orderId });
      setTrackedOrder(order);
    } catch {
      setError('Failed to track order');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const loadOrders = useCallback(
    async (status: 'ACTIVE' | 'PAST') => {
      if (!client) return;
      try {
        const orders = await fetchFoodOrders(client, { status });
        if (status === 'ACTIVE') setActiveOrders(orders);
        else setPastOrders(orders);
        return orders;
      } catch {
        return [];
      }
    },
    [client],
  );

  const cancelOrder = useCallback(async (orderId: string) => {
    if (!client) return;
    try {
      await cancelFoodOrder(client, { orderId, cancelledBy: 'user' });
      await loadOrders('ACTIVE');
      if (trackedOrder?.id === orderId) setTrackedOrder(null);
    } catch {
      // keep as-is
    }
  }, [client, trackedOrder, loadOrders]);

  const rateOrder = useCallback(
    async (orderId: string, rating: number, comment?: string) => {
      if (!client) return;
      try {
        await rateFoodOrder(client, { orderId, rating, comment });
        await loadOrders('PAST');
        const order = await fetchFoodOrderDetail(client, { orderId });
        if (order && trackedOrder?.id === orderId) setTrackedOrder(order);
      } catch {
        // keep as-is
      }
    },
    [client, trackedOrder, loadOrders],
  );

  const reorder = useCallback(async (orderId: string) => {
    if (!client) return;
    try {
      const next = await reorderFood(client, { orderId });
      setCart(next);
      return next;
    } catch {
      return null;
    }
  }, [client]);

  // ── Chat ─────────────────────────────────────────────────────────────────
  const openChat = useCallback(
    async (storeId: number | string) => {
      if (!client) return;
      setError(null);
      try {
        const history = await fetchFoodChatHistory(client, { storeId });
        setChatMessages(history.chat);
        setChatUserName(history.user_name);
      } catch {
        setChatUserName('');
        setChatMessages([]);
      }
    },
    [client],
  );

  const sendChat = useCallback(
    async (storeId: number | string, message: string) => {
      if (!client || !message.trim()) return;
      setSendingChat(true);
      try {
        await sendFoodChatMessage(client, { storeId, message: message.trim() });
        setChatMessages((prev) => [
          ...prev,
          {
            message: message.trim(),
            sender: 'USER',
            timestamp: Math.floor(Date.now() / 1000),
            username: '',
          },
        ]);
      } finally {
        setSendingChat(false);
      }
    },
    [client],
  );

  // ── Reset ────────────────────────────────────────────────────────────────
  const resetStore = useCallback(() => {
    setStoreDetails(null);
    setSelectedCategory(null);
    setProduct(null);
    setVariantId(null);
    setOptionIds([]);
    setQuantity(1);
    setPromo(null);
    setPromoCode('');
    setCheckoutResult(null);
  }, []);

  return {
    loading,
    error,

    stores,
    loadStores,

    storeDetails,
    selectedCategory,
    setSelectedCategory,
    openStore,
    resetStore,

    product,
    variantId,
    setVariantId,
    optionIds,
    setOptionIds,
    toggleOption,
    quantity,
    setQuantity,
    openProduct,

    cart,
    cartOpen,
    setCartOpen,
    refreshCart,
    addCurrentProductToCart,
    addToCartSimple,
    addToFoodCartWithSelection,
    changeQuantity,
    removeItem,
    emptyCart,
    setCartCount,

    promo,
    promoCode,
    setPromoCode,
    applyPromo,
    clearPromo,

    checkoutResult,
    runCheckout,

    placeOrder,
    lastPlacedOrderId,

    activeOrders,
    pastOrders,
    loadOrders,
    trackOrder,
    trackedOrder,
    setTrackedOrder,
    cancelOrder,
    rateOrder,
    reorder,

    chatMessages,
    chatUserName,
    sendingChat,
    openChat,
    sendChat,
  };
}

export type FoodFlow = ReturnType<typeof useFood>;