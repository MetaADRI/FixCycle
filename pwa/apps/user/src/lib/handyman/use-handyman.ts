'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  acceptHandymanBid,
  applyHandymanPromoWeb,
  cancelDeleteHandymanBidOrder,
  cancelHandymanOrder,
  confirmHandymanOrderWeb,
  counterBidHandymanOrder,
  createHandymanBidOrder,
  deleteHandymanCart,
  fetchHandymanBidOrderDetail,
  fetchHandymanBidOrders,
  fetchHandymanCart,
  fetchHandymanCategories,
  fetchHandymanOrderDetail,
  fetchHandymanOrders,
  fetchHandymanProviderDetail,
  fetchHandymanProviders,
  fetchHandymanServices,
  fetchHandymanTimeSlots,
  payHandymanBooking,
  rateHandymanProvider,
  saveHandymanCart,
  fetchHandymanProviderDetail as fetchProviderGallery,
} from '@fixcycle/api-client';
import type {
  HandymanBid,
  HandymanBidOrder,
  HandymanCart,
  HandymanCategory,
  HandymanOrder,
  HandymanOrderDetail,
  HandymanProvider,
  HandymanService,
  HandymanServicesResponse,
  HandymanTimeSlotResponse,
} from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface HandymanView {
  segmentId: string;
  categories: HandymanCategory[];
  categoriesLoading: boolean;
  selectedCategoryId: number | null;
  selectCategoryId: (id: number | null) => void;

  services: HandymanServicesResponse | null;
  servicesLoading: boolean;
  selectedServiceIds: number[];
  toggleService: (id: number) => void;
  clearServiceSelection: () => void;
  selectedServices: HandymanService[];

  providersLoading: boolean;
  providers: HandymanProvider[];
  providersPage: number;
  providersTotalPage: number;
  loadProviders: (segmentId: string | number) => Promise<boolean>;
  openProvider: (providerId: number | string, segmentId: string | number) => Promise<boolean>;
  provider: HandymanProvider | null;

  slots: HandymanTimeSlotResponse | null;
  slotsLoading: boolean;
  selectedSlotId: number | null;
  selectSlot: (id: number) => void;

  cart: HandymanCart | null;
  cartLoading: boolean;
  openCart: (cartId: number | string) => Promise<boolean>;
  addServiceToCart: (service: HandymanService, quantity?: number) => Promise<boolean>;
  updateCartService: (serviceTypeId: number, quantity: number) => Promise<boolean>;
  removeCartService: (serviceTypeId: number) => Promise<boolean>;
  clearCart: () => Promise<void>;
  applyPromo: (code: string) => Promise<boolean>;
  removePromo: () => Promise<boolean>;
  confirmOrder: (paymentMethodId: number, opts?: { cardId?: string | number; advancePaymentOfMinBill?: number; notes?: string }) => Promise<{ orderId: number } | null>;

  dropLocation: string;
  setDropLocation: (v: string) => void;
  latitude: string;
  longitude: string;

  ordersLoading: boolean;
  activeOrders: HandymanOrder[];
  scheduledOrders: HandymanOrder[];
  pastOrders: HandymanOrder[];
  loadOrders: (segmentId?: string | number) => Promise<void>;

  orderDetail: HandymanOrderDetail | null;
  orderDetailLoading: boolean;
  loadOrderDetail: (orderId: number | string) => Promise<boolean>;
  cancelOrder: (reasonId: number) => Promise<boolean>;
  rateOrder: (rating: number, comment?: string) => Promise<boolean>;
  payBooking: (amount: number | string, methodId?: number) => Promise<boolean>;

  bidsLoading: boolean;
  activeBids: HandymanBidOrder[];
  allBids: HandymanBidOrder[];
  loadBidOrders: () => Promise<void>;
  bidOrderDetail: HandymanBidOrder | null;
  loadBidOrderDetail: (orderId: number | string) => Promise<boolean>;
  createBidOrder: (form: {
    serviceTypeIds?: number[];
    description?: string;
    dropLocation?: string;
    bookingDate?: string;
    userOfferPrice?: number | string;
  }) => Promise<HandymanBidOrder | null>;
  counterBid: (driverBidId: number | string, amount: number | string) => Promise<boolean>;
  acceptBid: (driverId: number | string, promoCode?: string) => Promise<{ success: boolean; orderId?: number }>;
  cancelDeleteBid: (action: 'CANCEL' | 'DELETE') => Promise<boolean>;
  bids: HandymanBid[];

  loading: boolean;
  error: string | null;
  errorKey: string | null;
}

const DEFAULT_LAT = 19.076;
const DEFAULT_LNG = 72.877;

export function useHandyman(segmentId: string | undefined): HandymanView {
  const client = api;
  const seg = segmentId ?? '6';

  // Shared loading / error.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const setErrorMsg = (key: string | null, msg: string | null) => {
    setErrorKey(key);
    setError(msg);
  };

  // Categories + services for a segment.
  const [categories, setCategories] = useState<HandymanCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [services, setServices] = useState<HandymanServicesResponse | null>(null);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  // Providers.
  const [providers, setProviders] = useState<HandymanProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersPage, setProvidersPage] = useState(1);
  const [providersTotalPage, setProvidersTotalPage] = useState(0);
  const [provider, setProvider] = useState<HandymanProvider | null>(null);

  // Time slots.
  const [slots, setSlots] = useState<HandymanTimeSlotResponse | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  // Cart + booking location.
  const [cart, setCart] = useState<HandymanCart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [dropLocation, setDropLocation] = useState('');
  const [latitude] = useState(String(DEFAULT_LAT));
  const [longitude] = useState(String(DEFAULT_LNG));
  const [promoCode, setPromoCode] = useState('');

  // Orders.
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeOrders, setActiveOrders] = useState<HandymanOrder[]>([]);
  const [scheduledOrders, setScheduledOrders] = useState<HandymanOrder[]>([]);
  const [pastOrders, setPastOrders] = useState<HandymanOrder[]>([]);
  const [orderDetail, setOrderDetail] = useState<HandymanOrderDetail | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  // Bidding.
  const [bidsLoading, setBidsLoading] = useState(false);
  const [activeBids, setActiveBids] = useState<HandymanBidOrder[]>([]);
  const [allBids, setAllBids] = useState<HandymanBidOrder[]>([]);
  const [bidOrderDetail, setBidOrderDetail] = useState<HandymanBidOrder | null>(null);

  // ── Segment home: categories + services + slots ──────────────────────────
  const loadSegment = useCallback(
    async (segmentId: string | number) => {
      if (!client) return;
      setCategoriesLoading(true);
      setServicesLoading(true);
      setSlotsLoading(true);
      setErrorMsg(null, null);
      try {
        const [cats, svc, slotRes] = await Promise.all([
          fetchHandymanCategories(client, { segmentId }),
          fetchHandymanServices(client, { segmentId }),
          fetchHandymanTimeSlots(client, { segmentId }),
        ]);
        setCategories(cats);
        setServices(svc);
        setSlots(slotRes);
        setSelectedCategoryId(cats[0]?.id ?? null);
        const today = new Date().toISOString().slice(0, 10);
        const firstSlot = slotRes.time_slots[0];
        setSelectedSlotId(firstSlot?.id ?? null);
        if (firstSlot) {
          setDropLocation('');
          void fetchCartForSlot(firstSlot.id, today);
        }
        return () => {};
      } catch {
        setErrorMsg('errSegment', 'Failed to load services');
      } finally {
        setCategoriesLoading(false);
        setServicesLoading(false);
        setSlotsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client],
  );

  // Load the existing cart for the default slot on first open.
  const fetchCartForSlot = useCallback(
    async (slotId: number, date: string) => {
      if (!client) return;
      try {
        const next = await saveHandymanCart(client, {
          isUpdate: false,
          segmentId: seg,
          serviceTimeSlotDetailId: slotId,
          latitude: DEFAULT_LAT,
          longitude: DEFAULT_LNG,
          dropLocation: dropLocation || 'Home',
          bookingDate: date,
          autoAssign: 1,
        });
        setCart(next);
      } catch {
        setCart(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, seg],
  );

  const selectCategoryId = useCallback((id: number | null) => {
    setSelectedCategoryId(id);
  }, []);

  const toggleService = useCallback((id: number) => {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }, []);

  const clearServiceSelection = useCallback(() => {
    setSelectedServiceIds([]);
  }, []);

  const selectedServices: HandymanService[] = Array.isArray(services?.services)
    ? services!.services.filter((s) => selectedServiceIds.includes(s.id))
    : [];

  // ── Providers ────────────────────────────────────────────────────────────
  const loadProviders = useCallback(
    async (segmentId: string | number) => {
      if (!client || selectedServiceIds.length === 0) return false;
      setProvidersLoading(true);
      setErrorMsg(null, null);
      try {
        const result = await fetchHandymanProviders(client, {
          segmentId,
          selectedServices: selectedServiceIds,
          latitude: DEFAULT_LAT,
          longitude: DEFAULT_LNG,
        });
        setProviders(result.providers);
        setProvidersPage(result.currentPage || 1);
        setProvidersTotalPage(result.totalPages || 1);
        return result.providers.length > 0;
      } catch {
        setErrorMsg('errProviders', 'No handymen found');
        setProviders([]);
        return false;
      } finally {
        setProvidersLoading(false);
      }
    },
    [client, selectedServiceIds],
  );

  const openProvider = useCallback(
    async (providerId: number | string, segmentId: string | number) => {
      if (!client) return false;
      setProvider(null);
      setErrorMsg(null, null);
      try {
        const p = await fetchHandymanProviderDetail(client, { providerId, segmentId });
        setProvider(p);
        return p !== null;
      } catch {
        setErrorMsg('errProvider', 'Failed to load handyman');
        return false;
      }
    },
    [client],
  );

  // ── Cart actions ─────────────────────────────────────────────────────────
  const openCart = useCallback(
    async (cartId: number | string) => {
      if (!client) return false;
      setCartLoading(true);
      setErrorMsg(null, null);
      try {
        const next = await fetchHandymanCart(client, { cartId });
        setCart(next);
        setDropLocation(next.drop_location);
        if (next.applied_promo_code) setPromoCode(next.applied_promo_code);
        return true;
      } catch {
        setErrorMsg('errCart', 'Failed to load cart');
        return false;
      } finally {
        setCartLoading(false);
      }
    },
    [client],
  );

  const addServiceToCart = useCallback(
    async (service: HandymanService, quantity = 1) => {
      if (!client) return false;
      setLoading(true);
      setErrorMsg(null, null);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const next = await saveHandymanCart(client, {
          isUpdate: false,
          segmentId: seg,
          serviceTimeSlotDetailId: slots?.time_slots[0]?.id ?? selectedSlotId ?? 1,
          segmentPriceCardId: service.segment_price_card_id,
          latitude: DEFAULT_LAT,
          longitude: DEFAULT_LNG,
          dropLocation: dropLocation || 'Home',
          bookingDate: today,
          autoAssign: 1,
          serviceTypeId: service.id,
          serviceDetails: { [service.id]: [{ quantity }] },
        });
        setCart(next);
        return true;
      } catch {
        setErrorMsg('errCart', 'Failed to add service');
        return false;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, seg, selectedSlotId, slots, dropLocation],
  );

  const updateCartService = useCallback(
    async (serviceTypeId: number, quantity: number) => {
      if (!client || !cart) return false;
      try {
        const next = await saveHandymanCart(client, {
          isUpdate: true,
          segmentId: seg,
          segmentPriceCardId: cart.segment_price_card_id,
          latitude: DEFAULT_LAT,
          longitude: DEFAULT_LNG,
          dropLocation: cart.drop_location,
          bookingDate: cart.booking_date,
          autoAssign: 1,
          serviceTypeId,
          cartId: cart.cart_id,
          serviceDetails: { [serviceTypeId]: [{ quantity }] },
        });
        setCart(next);
        return true;
      } catch {
        return false;
      }
    },
    [client, cart, seg],
  );

  const removeCartService = useCallback(
    async (serviceTypeId: number) => {
      if (!client || !cart) return false;
      try {
        const next = await deleteHandymanCart(client, {
          cartId: cart.cart_id,
          deleteType: 'SERVICE',
          serviceTypeId,
        });
        if (next) setCart(next);
        return true;
      } catch {
        return false;
      }
    },
    [client, cart],
  );

  const clearCart = useCallback(async () => {
    if (!client || !cart) return;
    try {
      await deleteHandymanCart(client, { cartId: cart.cart_id, deleteType: 'CART' });
      setCart(null);
      setPromoCode('');
    } catch {
      // ignore
    }
  }, [client, cart]);

  const applyPromo = useCallback(
    async (code: string) => {
      if (!client || !cart || code.trim() === '') return false;
      try {
        const result = await applyHandymanPromoWeb(client, { cartId: cart.cart_id, promoCode: code.trim() });
        setCart(result.cart);
        if (result.cart.applied_promo_code) setPromoCode(result.cart.applied_promo_code);
        return result.cart.applied_promo_code === code.trim();
      } catch {
        return false;
      }
    },
    [client, cart],
  );

  const removePromo = useCallback(async () => {
    if (!client || !cart) return false;
    try {
      const result = await applyHandymanPromoWeb(client, { cartId: cart.cart_id });
      setCart(result.cart);
      setPromoCode('');
      return true;
    } catch {
      return false;
    }
  }, [client, cart]);

  const confirmOrder = useCallback(
    async (paymentMethodId: number, opts?: { cardId?: string | number; advancePaymentOfMinBill?: number; notes?: string }) => {
      if (!client || !cart) return null;
      setLoading(true);
      setErrorMsg(null, null);
      try {
        const result = await confirmHandymanOrderWeb(client, {
          cartId: cart.cart_id,
          paymentMethodId,
          latitude: DEFAULT_LAT,
          longitude: DEFAULT_LNG,
          dropLocation: cart.drop_location || 'Home',
          cardId: opts?.cardId,
          advancePaymentOfMinBill: opts?.advancePaymentOfMinBill ?? 0,
          additionalNotes: opts?.notes,
        });
        if (result) setCart(null);
        return result ? { orderId: result.order_id } : null;
      } catch {
        setErrorMsg('errConfirm', 'Failed to place booking');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client, cart],
  );

  // ── Orders ───────────────────────────────────────────────────────────────
  const loadOrders = useCallback(
    async (segmentId?: string | number) => {
      if (!client) return;
      setOrdersLoading(true);
      setErrorMsg(null, null);
      try {
        const q = segmentId != null ? { segmentId } : {};
        const [ongoing, scheduled, past] = await Promise.all([
          fetchHandymanOrders(client, { type: 'ONGOING', ...q }),
          fetchHandymanOrders(client, { type: 'SCHEDULED', ...q }),
          fetchHandymanOrders(client, { type: 'PAST', ...q }),
        ]);
        setActiveOrders([...scheduled, ...ongoing]);
        setScheduledOrders(scheduled);
        setPastOrders(past);
      } catch {
        setErrorMsg('errOrders', 'Failed to load orders');
      } finally {
        setOrdersLoading(false);
      }
    },
    [client],
  );

  const loadOrderDetail = useCallback(
    async (orderId: number | string) => {
      if (!client) return false;
      setOrderDetail(null);
      setOrderDetailLoading(true);
      setErrorMsg(null, null);
      try {
        const detail = await fetchHandymanOrderDetail(client, { orderId });
        setOrderDetail(detail);
        return true;
      } catch {
        setErrorMsg('errOrder', 'Failed to load order');
        return false;
      } finally {
        setOrderDetailLoading(false);
      }
    },
    [client],
  );

  const cancelOrder = useCallback(
    async (reasonId: number) => {
      if (!client || !orderDetail) return false;
      try {
        await cancelHandymanOrder(client, { orderId: orderDetail.order_id, cancelReasonId: reasonId, latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
        await loadOrderDetail(orderDetail.order_id);
        return true;
      } catch {
        return false;
      }
    },
    [client, orderDetail, loadOrderDetail],
  );

  const rateOrder = useCallback(
    async (rating: number, comment?: string) => {
      if (!client || !orderDetail) return false;
      try {
        await rateHandymanProvider(client, { orderId: orderDetail.order_id, rating, comment });
        await loadOrderDetail(orderDetail.order_id);
        return true;
      } catch {
        return false;
      }
    },
    [client, orderDetail, loadOrderDetail],
  );

  const payBooking = useCallback(
    async (amount: number | string, methodId = 1) => {
      if (!client || !orderDetail) return false;
      try {
        const result = await payHandymanBooking(client, { orderId: orderDetail.order_id, amount, paymentMethodId: methodId });
        await loadOrderDetail(orderDetail.order_id);
        return result.success;
      } catch {
        return false;
      }
    },
    [client, orderDetail, loadOrderDetail],
  );

  // ── Bidding ──────────────────────────────────────────────────────────────
  const loadBidOrders = useCallback(async () => {
    if (!client) return;
    setBidsLoading(true);
    setErrorMsg(null, null);
    try {
      const [active, all] = await Promise.all([
        fetchHandymanBidOrders(client, { type: 'ACTIVE' }),
        fetchHandymanBidOrders(client, { type: 'ALL' }),
      ]);
      setActiveBids(active);
      setAllBids(all);
    } catch {
      setErrorMsg('errBids', 'Failed to load work requests');
    } finally {
      setBidsLoading(false);
    }
  }, [client]);

  const loadBidOrderDetail = useCallback(
    async (orderId: number | string) => {
      if (!client) return false;
      setBidOrderDetail(null);
      setBidsLoading(true);
      setErrorMsg(null, null);
      try {
        const detail = await fetchHandymanBidOrderDetail(client, { orderId });
        setBidOrderDetail(detail);
        return true;
      } catch {
        setErrorMsg('errBid', 'Failed to load work request');
        return false;
      } finally {
        setBidsLoading(false);
      }
    },
    [client],
  );

  const createBidOrder = useCallback(
    async (form: { serviceTypeIds?: number[]; description?: string; dropLocation?: string; bookingDate?: string; userOfferPrice?: number | string }) => {
      if (!client) return null;
      setLoading(true);
      setErrorMsg(null, null);
      try {
        const created = await createHandymanBidOrder(client, {
          segmentId: seg,
          serviceTypeIds: form.serviceTypeIds,
          description: form.description,
          dropLocation: form.dropLocation || '',
          bookingDate: form.bookingDate,
          userOfferPrice: form.userOfferPrice,
          serviceTimeSlotDetailId: selectedSlotId ?? undefined,
          latitude: DEFAULT_LAT,
          longitude: DEFAULT_LNG,
        });
        setBidOrderDetail(created);
        return created;
      } catch {
        setErrorMsg('errBid', 'Failed to post work request');
        return null;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, seg, selectedSlotId],
  );

  const counterBid = useCallback(
    async (driverBidId: number | string, amount: number | string) => {
      if (!client || !bidOrderDetail) return false;
      try {
        await counterBidHandymanOrder(client, { orderId: bidOrderDetail.bid_order_id, driverBidId, amount });
        await loadBidOrderDetail(bidOrderDetail.bid_order_id);
        return true;
      } catch {
        return false;
      }
    },
    [client, bidOrderDetail, loadBidOrderDetail],
  );

  const acceptBid = useCallback(
    async (driverId: number | string, promoCodeInput?: string) => {
      if (!client || !bidOrderDetail) return { success: false };
      try {
        const result = await acceptHandymanBid(client, { orderId: bidOrderDetail.bid_order_id, driverId, promoCode: promoCodeInput });
        if (result.success) await loadBidOrderDetail(bidOrderDetail.bid_order_id);
        return result;
      } catch {
        return { success: false };
      }
    },
    [client, bidOrderDetail, loadBidOrderDetail],
  );

  const cancelDeleteBid = useCallback(
    async (action: 'CANCEL' | 'DELETE') => {
      if (!client || !bidOrderDetail) return false;
      try {
        await cancelDeleteHandymanBidOrder(client, { orderId: bidOrderDetail.bid_order_id, action });
        await loadBidOrderDetail(bidOrderDetail.bid_order_id);
        return true;
      } catch {
        return false;
      }
    },
    [client, bidOrderDetail, loadBidOrderDetail],
  );

  // Entry: load segment data on first mount.
  useEffect(() => {
    void loadSegment(seg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg]);

  const selectSlot = useCallback((id: number) => {
    setSelectedSlotId(id);
  }, []);

  return {
    segmentId: seg,
    categories,
    categoriesLoading,
    selectedCategoryId,
    selectCategoryId,
    services,
    servicesLoading,
    selectedServiceIds,
    toggleService,
    clearServiceSelection,
    selectedServices,
    providersLoading,
    providers,
    providersPage,
    providersTotalPage,
    loadProviders,
    openProvider,
    provider,
    slots,
    slotsLoading,
    selectedSlotId,
    selectSlot,
    cart,
    cartLoading,
    openCart,
    addServiceToCart,
    updateCartService,
    removeCartService,
    clearCart,
    applyPromo,
    removePromo,
    confirmOrder,
    dropLocation,
    setDropLocation,
    latitude,
    longitude,
    ordersLoading,
    activeOrders,
    scheduledOrders,
    pastOrders,
    loadOrders,
    orderDetail,
    orderDetailLoading,
    loadOrderDetail,
    cancelOrder,
    rateOrder,
    payBooking,
    bidsLoading,
    activeBids,
    allBids,
    loadBidOrders,
    bidOrderDetail,
    loadBidOrderDetail,
    createBidOrder,
    counterBid,
    acceptBid,
    cancelDeleteBid,
    bids: bidOrderDetail?.bids ?? [],
    loading,
    error,
    errorKey,
  };
}

// Re-export gallery lookup used by the provider gallery screen (driver gallery).
export async function loadProviderGallery(providerId: number | string, segmentId: string | number) {
  return fetchProviderGallery(api, { providerId, segmentId });
}