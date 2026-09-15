'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  applyLaundryPromo,
  cancelLaundryOrder,
  confirmLaundryOrder,
  deleteLaundryCart,
  fetchLaundryCart,
  fetchLaundryCategories,
  fetchLaundryOrderDetail,
  fetchLaundryOrders,
  fetchLaundryOutletDetail,
  fetchLaundryOutlets,
  fetchLaundryServices,
  fetchLaundryTimeSlots,
  rateLaundryOutlet,
  saveLaundryCart,
  verifyLaundryOtp,
} from '@fixcycle/api-client';
import type {
  LaundryCart,
  LaundryCategory,
  LaundryOrder,
  LaundryOrderDetail,
  LaundryOutlet,
  LaundryService,
  LaundryTimeSlotResponse,
} from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface LaundryView {
  segmentId: string;

  outletsLoading: boolean;
  outlets: LaundryOutlet[];
  loadOutlets: () => Promise<boolean>;
  outlet: LaundryOutlet | null;
  outletLoading: boolean;
  loadOutlet: (outletId: number | string) => Promise<boolean>;
  initCatalog: () => Promise<void>;

  categories: LaundryCategory[];
  categoriesLoading: boolean;
  selectedCategoryId: number | null;
  selectCategoryId: (id: number | null) => void;
  services: LaundryService[];
  servicesLoading: boolean;

  slots: LaundryTimeSlotResponse | null;
  slotsLoading: boolean;
  selectedSlotId: number | null;
  selectSlot: (id: number) => void;
  bookingDate: string;

  cart: LaundryCart | null;
  cartLoading: boolean;
  loadCart: (outletId: number | string) => Promise<boolean>;
  addItems: (outletId: number | string, items: { laundryServiceId: number; quantity: number }[]) => Promise<boolean>;
  decrementItem: (outletId: number | string, laundryServiceId: number) => Promise<boolean>;
  removeItem: (outletId: number | string, laundryServiceId: number) => Promise<boolean>;
  clearCart: (outletId: number | string) => Promise<boolean>;
  applyPromo: (outletId: number | string, code: string) => Promise<boolean>;
  savePickup: (outletId: number | string, opts: { serviceTypeId?: number; slotId?: number; dropLocation?: string }) => Promise<boolean>;
  confirmOrder: (outletId: number | string, opts: { paymentMethodId: number; dropLocation?: string }) => Promise<{ orderId: number } | null>;

  ordersLoading: boolean;
  ongoingOrders: LaundryOrder[];
  pastOrders: LaundryOrder[];
  loadOrders: () => Promise<void>;

  orderDetailLoading: boolean;
  orderDetail: LaundryOrderDetail | null;
  loadOrderDetail: (orderId: number | string) => Promise<boolean>;
  verifyOtp: (orderId: number | string, otp: string) => Promise<boolean>;
  cancelOrder: (orderId: number | string, reasonId: number) => Promise<boolean>;
  rateOrder: (orderId: number | string, rating: number, comment?: string) => Promise<boolean>;

  loading: boolean;
  error: string | null;
}

export function useLaundry(): LaundryView {
  const client = api;
  const segmentId = '5';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Outlets.
  const [outlets, setOutlets] = useState<LaundryOutlet[]>([]);
  const [outletsLoading, setOutletsLoading] = useState(false);
  const [outlet, setOutlet] = useState<LaundryOutlet | null>(null);
  const [outletLoading, setOutletLoading] = useState(false);

  // Categories + services.
  const [categories, setCategories] = useState<LaundryCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [services, setServices] = useState<LaundryService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Slots.
  const [slots, setSlots] = useState<LaundryTimeSlotResponse | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState('');

  // Cart + orders.
  const [cart, setCart] = useState<LaundryCart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ongoingOrders, setOngoingOrders] = useState<LaundryOrder[]>([]);
  const [pastOrders, setPastOrders] = useState<LaundryOrder[]>([]);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<LaundryOrderDetail | null>(null);

  const loadOutlets = useCallback(async (): Promise<boolean> => {
    if (!client) return false;
    setOutletsLoading(true);
    setError(null);
    try {
      const list = await fetchLaundryOutlets(client, { segmentId });
      setOutlets(list);
      return true;
    } catch {
      setError('Failed to load outlets');
      return false;
    } finally {
      setOutletsLoading(false);
    }
  }, [client]);

  const loadOutlet = useCallback(async (outletId: number | string): Promise<boolean> => {
    if (!client) return false;
    setOutletLoading(true);
    setError(null);
    try {
      const o = await fetchLaundryOutletDetail(client, { outletId });
      if (!o) {
        setError('Outlet not found');
        return false;
      }
      setOutlet(o);
      return true;
    } catch {
      setError('Failed to load outlet');
      return false;
    } finally {
      setOutletLoading(false);
    }
  }, [client]);

  const loadCatalog = useCallback(async () => {
    if (!client) return;
    setCategoriesLoading(true);
    setServicesLoading(true);
    setSlotsLoading(true);
    setError(null);
    try {
      const [cats, slotRes] = await Promise.all([
        fetchLaundryCategories(client, { segmentId }),
        fetchLaundryTimeSlots(client, { segmentId }),
      ]);
      setCategories(cats);
      setSlots(slotRes);
      setSelectedCategoryId(cats[0]?.id ?? null);
      setSelectedSlotId(slotRes.time_slots[0]?.id ?? null);
      setBookingDate(slotRes.time_slots[0]?.date ?? new Date().toISOString().slice(0, 10));
      const scv = await fetchLaundryServices(client, { segmentId, categoryId: cats[0]?.id });
      setServices(scv.services);
    } catch {
      setError('Failed to load services');
    } finally {
      setCategoriesLoading(false);
      setServicesLoading(false);
      setSlotsLoading(false);
    }
  }, [client]);

  const selectCategoryId = useCallback(
    async (id: number | null) => {
      setSelectedCategoryId(id);
      if (!client) return;
      try {
        const scv = await fetchLaundryServices(client, { segmentId, categoryId: id ?? undefined });
        setServices(scv.services);
      } catch {
        setError('Failed to load services');
      }
    },
    [client],
  );

  const selectSlot = useCallback((id: number) => {
    setSelectedSlotId(id);
    const slot = slots?.time_slots.find((s) => s.id === id);
    if (slot) setBookingDate(slot.date);
  }, [slots]);

  const loadCart = useCallback(async (outletId: number | string): Promise<boolean> => {
    if (!client) return false;
    setCartLoading(true);
    setError(null);
    try {
      const c = await fetchLaundryCart(client, { outletId });
      setCart(c);
      return true;
    } catch {
      setError('Failed to load cart');
      return false;
    } finally {
      setCartLoading(false);
    }
  }, [client]);

  const addItems = useCallback(async (outletId: number | string, items: { laundryServiceId: number; quantity: number }[]): Promise<boolean> => {
    if (!client) return false;
    setCartLoading(true);
    setError(null);
    try {
      const existing = await fetchLaundryCart(client, { outletId });
      const merged = existing.items.map((i) => ({ ...i }));
      for (const item of items) {
        const found = merged.find((i) => i.laundry_service_id === item.laundryServiceId);
        if (found) found.quantity += item.quantity;
        else merged.push({ laundry_service_id: item.laundryServiceId, quantity: item.quantity, title: '', price: 0, image: '', category_id: 0 });
      }
      const c = await saveLaundryCart(client, {
        outletId,
        segmentId,
        serviceTypeId: existing.service_type_id,
        serviceTimeSlotDetailId: existing.service_time_slot_detail_id,
        dropLocation: existing.drop_location,
        items: merged.map((i) => ({ laundryServiceId: i.laundry_service_id, quantity: i.quantity })),
      });
      setCart(c);
      return true;
    } catch {
      setError('Failed to update cart');
      return false;
    } finally {
      setCartLoading(false);
    }
  }, [client]);

  const savePickup = useCallback(
    async (outletId: number | string, opts: { serviceTypeId?: number; slotId?: number; dropLocation?: string }): Promise<boolean> => {
      if (!client) return false;
      setCartLoading(true);
      setError(null);
      try {
        const existing = await fetchLaundryCart(client, { outletId });
        const c = await saveLaundryCart(client, {
          outletId,
          segmentId,
          serviceTypeId: opts.serviceTypeId ?? existing.service_type_id,
          serviceTimeSlotDetailId: opts.slotId ?? selectedSlotId ?? existing.service_time_slot_detail_id,
          bookingDate: existing.booking_date,
          dropLocation: opts.dropLocation ?? existing.drop_location,
          items: existing.items.map((i) => ({ laundryServiceId: i.laundry_service_id, quantity: i.quantity })),
        });
        setCart(c);
        return true;
      } catch {
        setError('Failed to save pickup details');
        return false;
      } finally {
        setCartLoading(false);
      }
    },
    [client, selectedSlotId],
  );

  const removeItem = useCallback(async (outletId: number | string, laundryServiceId: number): Promise<boolean> => {
    if (!client) return false;
    setCartLoading(true);
    setError(null);
    try {
      const c = await deleteLaundryCart(client, { outletId, laundryServiceId });
      setCart(c);
      return true;
    } catch {
      setError('Failed to remove item');
      return false;
    } finally {
      setCartLoading(false);
    }
  }, [client]);

  const decrementItem = useCallback(async (outletId: number | string, laundryServiceId: number): Promise<boolean> => {
    if (!client) return false;
    setCartLoading(true);
    setError(null);
    try {
      const existing = await fetchLaundryCart(client, { outletId });
      const current = existing.items.find((i) => i.laundry_service_id === laundryServiceId);
      if (!current || current.quantity <= 0) {
        setCart(existing);
        return true;
      }
      const nextQuantity = current.quantity - 1;
      const items =
        nextQuantity > 0
          ? existing.items.map((i) => (i.laundry_service_id === laundryServiceId ? { ...i, quantity: nextQuantity } : i))
          : existing.items.filter((i) => i.laundry_service_id !== laundryServiceId);
      const c = await saveLaundryCart(client, {
        outletId,
        segmentId,
        serviceTypeId: existing.service_type_id,
        serviceTimeSlotDetailId: existing.service_time_slot_detail_id,
        bookingDate: existing.booking_date,
        dropLocation: existing.drop_location,
        items: items.map((i) => ({ laundryServiceId: i.laundry_service_id, quantity: i.quantity })),
      });
      setCart(c);
      return true;
    } catch {
      setError('Failed to update cart');
      return false;
    } finally {
      setCartLoading(false);
    }
  }, [client]);

  const clearCart = useCallback(async (outletId: number | string): Promise<boolean> => {
    if (!client) return false;
    setCartLoading(true);
    setError(null);
    try {
      const c = await deleteLaundryCart(client, { outletId });
      setCart(c);
      return true;
    } catch {
      setError('Failed to clear cart');
      return false;
    } finally {
      setCartLoading(false);
    }
  }, [client]);

  const applyPromo = useCallback(async (outletId: number | string, code: string): Promise<boolean> => {
    if (!client) return false;
    setCartLoading(true);
    setError(null);
    try {
      const c = await applyLaundryPromo(client, { outletId, promoCode: code });
      setCart(c);
      return true;
    } catch {
      setError('Promo code could not be applied');
      return false;
    } finally {
      setCartLoading(false);
    }
  }, [client]);

  const confirmOrder = useCallback(
    async (outletId: number | string, opts: { paymentMethodId: number; dropLocation?: string }): Promise<{ orderId: number } | null> => {
      if (!client) return null;
      setLoading(true);
      setError(null);
      try {
        const result = await confirmLaundryOrder(client, {
          outletId,
          paymentMethodId: opts.paymentMethodId,
          dropLocation: opts.dropLocation ?? '',
        });
        if (result.order_id == null) {
          setError(result.message);
          return null;
        }
        setCart(null);
        return { orderId: result.order_id };
      } catch {
        setError('Order could not be placed');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const loadOrders = useCallback(async (): Promise<void> => {
    if (!client) return;
    setOrdersLoading(true);
    setError(null);
    try {
      const [ongoing, past] = await Promise.all([
        fetchLaundryOrders(client, { type: 'ONGOING' }),
        fetchLaundryOrders(client, { type: 'PAST' }),
      ]);
      setOngoingOrders(ongoing);
      setPastOrders(past);
    } catch {
      setError('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  }, [client]);

  const loadOrderDetail = useCallback(async (orderId: number | string): Promise<boolean> => {
    if (!client) return false;
    setOrderDetailLoading(true);
    setError(null);
    try {
      const d = await fetchLaundryOrderDetail(client, { orderId });
      setOrderDetail(d);
      return true;
    } catch {
      setError('Failed to load order');
      return false;
    } finally {
      setOrderDetailLoading(false);
    }
  }, [client]);

  const verifyOtp = useCallback(async (orderId: number | string, otp: string): Promise<boolean> => {
    if (!client) return false;
    setOrderDetailLoading(true);
    setError(null);
    try {
      const res = await verifyLaundryOtp(client, { orderId, otp });
      if (!res.valid) {
        setError(res.message);
        return false;
      }
      if (res.order) setOrderDetail(res.order);
      return true;
    } catch {
      setError('OTP verification failed');
      return false;
    } finally {
      setOrderDetailLoading(false);
    }
  }, [client]);

  const cancelOrder = useCallback(async (orderId: number | string, reasonId: number): Promise<boolean> => {
    if (!client) return false;
    setLoading(true);
    setError(null);
    try {
      const res = await cancelLaundryOrder(client, { orderId, cancelReasonId: reasonId });
      if (!res.success) {
        setError(res.message);
        return false;
      }
      setOrderDetail((prev) => (prev ? { ...prev, order_status: 2, order_status_text: 'Cancelled' } : prev));
      return true;
    } catch {
      setError('Could not cancel order');
      return false;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const rateOrder = useCallback(async (orderId: number | string, rating: number, comment?: string): Promise<boolean> => {
    if (!client) return false;
    setLoading(true);
    setError(null);
    try {
      await rateLaundryOutlet(client, { orderId, rating, comment });
      setOrderDetail((prev) => (prev ? { ...prev, is_rated: true } : prev));
      return true;
    } catch {
      setError('Could not submit rating');
      return false;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    segmentId,
    outletsLoading,
    outlets,
    loadOutlets,
    outlet,
    outletLoading,
    loadOutlet,
    initCatalog: loadCatalog,
    categories,
    categoriesLoading,
    selectedCategoryId,
    selectCategoryId,
    services,
    servicesLoading,
    slots,
    slotsLoading,
    selectedSlotId,
    selectSlot,
    bookingDate,
    cart,
    cartLoading,
    loadCart,
    addItems,
    decrementItem,
    removeItem,
    clearCart,
    applyPromo,
    savePickup,
    confirmOrder,
    ordersLoading,
    ongoingOrders,
    pastOrders,
    loadOrders,
    orderDetailLoading,
    orderDetail,
    loadOrderDetail,
    verifyOtp,
    cancelOrder,
    rateOrder,
    loading,
    error,
  };
}