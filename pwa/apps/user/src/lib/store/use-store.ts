'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  addToStoreCart,
  applyStorePromo,
  cancelStoreOrder,
  clearStoreCart,
  fetchStoreCart,
  fetchStoreChatHistory,
  fetchStoreCheckout,
  fetchStoreOrderDetail,
  fetchStoreOrders,
  fetchStoreDetails,
  fetchStores,
  placeStoreOrder,
  rateStoreOrder,
  removeFromStoreCart,
  reorderStore,
  searchStoreProducts,
  sendStoreChatMessage,
  trackStoreOrder,
  updateStoreCart,
} from '@fixcycle/api-client';
import type {
  Store,
  StoreCart,
  StoreCartItem,
  StoreCategory,
  StoreChatMessage,
  StoreCheckoutResult,
  StoreDetails,
  StoreOrder,
  StoreProduct,
  StorePromoResult,
  StoreSearchResult,
  StoreTimeSlot,
  StoreSlug,
} from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface StoreDetailsView {
  store: Store | null;
  categories: StoreCategory[];
  products: StoreProduct[];
  time_slots: StoreTimeSlot[];
  use_time_slots: number;
}

export function useStore(slug: StoreSlug = 'grocery') {
  const client = api;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const setErrorMsg = (key: string | null, msg: string | null) => {
    setErrorKey(key);
    setError(msg);
  };

  // Store home.
  const [stores, setStores] = useState<Store[]>([]);

  // Store menu.
  const [storeDetails, setStoreDetails] = useState<StoreDetailsView | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory | null>(null);

  // Search.
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<StoreSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchingOpen, setSearchingOpen] = useState(false);

  // Pharmacy prescription upload (client-side, object URL).
  const [prescriptionName, setPrescriptionName] = useState('');
  const [prescriptionUrl, setPrescriptionUrl] = useState<string | null>(null);

  // Product selection.
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [variantId, setVariantId] = useState<number | string | null>(null);
  const [optionIds, setOptionIds] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Cart.
  const [cart, setCart] = useState<StoreCart>({ products: [], total_items: 0 });
  const [cartOpen, setCartOpen] = useState(false);

  // Promo + checkout.
  const [promo, setPromo] = useState<StorePromoResult | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [checkoutResult, setCheckoutResult] = useState<StoreCheckoutResult | null>(null);

  // Checkout options.
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [deliveryMode, setDeliveryMode] = useState(1);
  const [paymentMode, setPaymentMode] = useState('1');

  // Orders.
  const [activeOrders, setActiveOrders] = useState<StoreOrder[]>([]);
  const [pastOrders, setPastOrders] = useState<StoreOrder[]>([]);
  const [trackedOrder, setTrackedOrder] = useState<StoreOrder | null>(null);

  // Chat.
  const [chatMessages, setChatMessages] = useState<StoreChatMessage[]>([]);
  const [chatUserName, setChatUserName] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState<string | null>(null);

  // ── Home: load store list for the segment ────────────────────────────────
  const loadStores = useCallback(
    async (segment: StoreSlug = slug) => {
      if (!client) return;
      setLoading(true);
      setErrorMsg(null, null);
      try {
        const list = await fetchStores(client, { slug: segment });
        setStores(list);
      } catch {
        setErrorMsg('errStore', 'Failed to load stores');
      } finally {
        setLoading(false);
      }
    },
    [client, slug],
  );

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  // ── Store menu ───────────────────────────────────────────────────────────
  const openStore = useCallback(
    async (storeId: number | string) => {
      if (!client) return;
      setLoading(true);
      setErrorMsg(null, null);
      setSearchQuery('');
      setSearchResult(null);
      try {
        const details = await fetchStoreDetails(client, { storeId });
        setStoreDetails(details as StoreDetailsView | null);
        const cats = details?.categories ?? [];
        setSelectedCategory(cats[0] ?? null);
        if (details?.use_time_slots) {
          const first = details.time_slots?.[0];
          setSelectedSlotId(first?.id ?? null);
        }
      } catch {
        setErrorMsg('errMenu', 'Failed to load store');
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  // ── Search ───────────────────────────────────────────────────────────────
  const runSearch = useCallback(
    async (keyword: string) => {
      const storeId = storeDetails?.store?.id;
      if (!client || !storeId) return;
      setSearching(true);
      setErrorMsg(null, null);
      try {
        const result = await searchStoreProducts(client, { storeId, keyword });
        setSearchResult(result);
      } catch {
        setSearchResult(null);
      } finally {
        setSearching(false);
      }
    },
    [client, storeDetails],
  );

  const openSearch = useCallback(() => {
    setSearchingOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchingOpen(false);
    setSearchQuery('');
    setSearchResult(null);
  }, []);

  // ── Prescription upload ──────────────────────────────────────────────────
  const setPrescriptionFile = useCallback((file: File | null) => {
    if (!file) {
      setPrescriptionName('');
      setPrescriptionUrl(null);
      return;
    }
    setPrescriptionName(file.name);
    const url = URL.createObjectURL(file);
    setPrescriptionUrl(url);
  }, []);

  // ── Product selection ────────────────────────────────────────────────────
  const openProduct = useCallback((p: StoreProduct) => {
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
      const next = await fetchStoreCart(client);
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
    setErrorMsg(null, null);
    try {
      const next = await addToStoreCart(client, {
        productId: product.id,
        quantity,
        variantId: variantId ?? undefined,
        optionIds,
      });
      setCart(next);
      setCartOpen(true);
    } catch {
      setErrorMsg('errCart', 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  }, [client, product, quantity, variantId, optionIds]);

  const addToCartSimple = useCallback(
    async (p: StoreProduct) => {
      if (!client) return;
      try {
        const next = await addToStoreCart(client, {
          productId: p.id,
          quantity: 1,
          variantId: p.variants[0]?.id,
        });
        setCart(next);
      } catch {
        setErrorMsg('errCart', 'Failed to add to cart');
      }
    },
    [client],
  );

  const addToStoreCartWithSelection = useCallback(
    async (p: StoreProduct, qty: number) => {
      if (!client) return;
      setLoading(true);
      setErrorMsg(null, null);
      try {
        const next = await addToStoreCart(client, {
          productId: p.id,
          quantity: qty,
          variantId: variantId ?? undefined,
          optionIds,
        });
        setCart(next);
        setCartOpen(true);
      } catch {
        setErrorMsg('errCart', 'Failed to add to cart');
      } finally {
        setLoading(false);
      }
    },
    [client, variantId, optionIds],
  );

  const changeQuantity = useCallback(
    async (item: StoreCartItem, nextQuantity: number) => {
      if (!client) return;
      try {
        if (nextQuantity <= 0) {
          const next = await removeFromStoreCart(client, { cartId: item.cart_id });
          setCart(next);
          return;
        }
        const next = await updateStoreCart(client, { cartId: item.cart_id, quantity: nextQuantity });
        setCart(next);
      } catch {
        // keep cart unchanged
      }
    },
    [client],
  );

  const removeItem = useCallback(
    async (cartId: string) => {
      if (!client) return;
      try {
        const next = await removeFromStoreCart(client, { cartId });
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
      const next = await clearStoreCart(client);
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
      setErrorMsg(null, null);
      try {
        const result = await applyStorePromo(client, { promoCode: code.trim().toUpperCase() });
        setPromo(result);
        setPromoCode(result.promo_code);
      } catch (e) {
        setErrorMsg('promoInvalid', e instanceof Error ? e.message : 'Invalid promo code');
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
      timeSlotId?: number | null;
    }) => {
      if (!client) return null;
      setLoading(true);
      setErrorMsg(null, null);
      try {
        const result = await fetchStoreCheckout(client, {
          storeId: params.storeId,
          deliveryMode: params.deliveryMode,
          paymentMode: params.paymentMode,
          address: params.address,
          latitude: params.latitude,
          longitude: params.longitude,
          promoCode: promoCode || undefined,
          timeSlotId: params.timeSlotId ?? undefined,
          prescriptionImage: prescriptionUrl ?? undefined,
        });
        setCheckoutResult(result);
        return result;
      } catch (e) {
        setErrorMsg('errCheckout', e instanceof Error ? e.message : 'Failed to prepare checkout');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client, promoCode, prescriptionUrl],
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
      timeSlotId?: number | null;
    }) => {
      if (!client) return null;
      setLoading(true);
      setErrorMsg(null, null);
      try {
        const placed = await placeStoreOrder(client, {
          checkoutId: params.checkoutId,
          storeId: params.storeId,
          deliveryMode: params.deliveryMode,
          paymentMode: params.paymentMode,
          address: params.address,
          latitude: params.latitude,
          longitude: params.longitude,
          timeSlotId: params.timeSlotId ?? undefined,
          prescriptionImage: prescriptionUrl ?? undefined,
        });
        setLastPlacedOrderId(placed.id || null);
        setCart((prev) => ({ products: [], total_items: 0 }));
        setPromo(null);
        setPromoCode('');
        setCheckoutResult(null);
        setPrescriptionName('');
        setPrescriptionUrl(null);
        return placed;
      } catch (e) {
        setErrorMsg('errCheckout', e instanceof Error ? e.message : 'Failed to place order');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client, prescriptionUrl],
  );

  // ── Track / orders ───────────────────────────────────────────────────────
  const trackOrder = useCallback(async (orderId: string) => {
    if (!client) return;
    setLoading(true);
    setErrorMsg(null, null);
    try {
      const order = await trackStoreOrder(client, { orderId });
      setTrackedOrder(order);
    } catch {
      setErrorMsg('errTrack', 'Failed to track order');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const loadOrders = useCallback(
    async (status: 'ACTIVE' | 'PAST') => {
      if (!client) return;
      try {
        const orders = await fetchStoreOrders(client, { status });
        if (status === 'ACTIVE') setActiveOrders(orders);
        else setPastOrders(orders);
        return orders;
      } catch {
        return [];
      }
    },
    [client],
  );

  useEffect(() => {
    void loadOrders('ACTIVE');
    void loadOrders('PAST');
  }, [loadOrders]);

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!client) return;
      try {
        await cancelStoreOrder(client, { orderId, cancelledBy: 'user' });
        await loadOrders('ACTIVE');
        if (trackedOrder?.id === orderId) setTrackedOrder(null);
      } catch {
        // keep as-is
      }
    },
    [client, trackedOrder, loadOrders],
  );

  const rateOrder = useCallback(
    async (orderId: string, rating: number, comment?: string) => {
      if (!client) return;
      try {
        await rateStoreOrder(client, { orderId, rating, comment });
        await loadOrders('PAST');
        const order = await fetchStoreOrderDetail(client, { orderId });
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
      const next = await reorderStore(client, { orderId });
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
      setErrorMsg(null, null);
      try {
        const history = await fetchStoreChatHistory(client, { storeId });
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
        await sendStoreChatMessage(client, { storeId, message: message.trim() });
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
    setSearchQuery('');
    setSearchResult(null);
    setProduct(null);
    setVariantId(null);
    setOptionIds([]);
    setQuantity(1);
    setPromo(null);
    setPromoCode('');
    setCheckoutResult(null);
    setSelectedSlotId(null);
    setPrescriptionName('');
    setPrescriptionUrl(null);
  }, []);

  return {
    slug,
    loading,
    error,
    errorKey,

    stores,
    loadStores,

    storeDetails,
    selectedCategory,
    setSelectedCategory,
    openStore,
    resetStore,

    searchQuery,
    setSearchQuery,
    searchResult,
    searching,
    searchingOpen,
    runSearch,
    openSearch,
    closeSearch,

    isPharmacy: slug === 'pharmacy',
    prescriptionName,
    prescriptionUrl,
    setPrescriptionFile,

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
    addToStoreCartWithSelection,
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

    selectedSlotId,
    setSelectedSlotId,
    deliveryMode,
    setDeliveryMode,
    paymentMode,
    setPaymentMode,

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

export type StoreFlow = ReturnType<typeof useStore>;
