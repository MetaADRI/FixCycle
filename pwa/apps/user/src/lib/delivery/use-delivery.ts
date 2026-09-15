'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchDeliveryPackages,
  fetchDeliveryProductList,
  fetchDeliveryCategoryTypes,
  fetchDeliveryVehiclePackage,
  fetchDeliveryCheckout,
  confirmDeliveryBooking,
} from '@fixcycle/api-client';
import type {
  DeliveryPackage,
  DeliveryProduct,
  DeliveryCategoryType,
  DeliveryVehicle,
  DeliveryDrop,
  DeliveryCheckoutResult,
} from '@fixcycle/api-client';
import { api } from '@/lib/api';

export type DeliveryStep = 'home' | 'category' | 'product' | 'vehicle' | 'checkout' | 'confirmed';

export interface DeliveryCheckoutParams {
  pickupLocation: string;
  pickupLatitude: number;
  pickupLongitude: number;
  drops: DeliveryDrop[];
  productId: number;
  categoryId: number;
  deliveryPackageId: number;
  weight: number;
  vehicleType: number;
}

export function useDelivery() {
  const client = api;

  const [step, setStep] = useState<DeliveryStep>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [packages, setPackages] = useState<DeliveryPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<DeliveryPackage | null>(null);

  const [categories, setCategories] = useState<DeliveryCategoryType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DeliveryCategoryType | null>(null);

  const [products, setProducts] = useState<DeliveryProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<DeliveryProduct | null>(null);

  const [vehicles, setVehicles] = useState<DeliveryVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<DeliveryVehicle | null>(null);

  const [drops, setDrops] = useState<DeliveryDrop[]>([
    { drop_latitude: 0, drop_longitude: 0, drop_location: '', contact_name: '', contact_phone: '', instruction: '' },
  ]);
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLatitude, setPickupLatitude] = useState(19.076);
  const [pickupLongitude, setPickupLongitude] = useState(72.877);

  const [checkoutResult, setCheckoutResult] = useState<DeliveryCheckoutResult | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [currency, setCurrency] = useState('₹');

  // Prime the home step with packages + categories on mount.
  useEffect(() => {
    void (async () => {
      if (!client) return;
      setLoading(true);
      try {
        const [pkgs, cats] = await Promise.all([
          fetchDeliveryPackages(client),
          fetchDeliveryCategoryTypes(client),
        ]);
        setPackages(pkgs);
        setCategories(cats);
      } catch {
        setError('Failed to load delivery setup');
      } finally {
        setLoading(false);
      }
    })();
  }, [client]);

  const selectCategory = useCallback(async (cat: DeliveryCategoryType) => {
    if (!client) return;
    setSelectedCategory(cat);
    setLoading(true);
    setError(null);
    try {
      const prods = await fetchDeliveryProductList(client, { categoryId: cat.id });
      setProducts(prods);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const selectProduct = useCallback(async (prod: DeliveryProduct) => {
    if (!client) return;
    setSelectedProduct(prod);
    setLoading(true);
    setError(null);
    try {
      const pkgId = selectedPackage?.id || 202;
      const vehs = await fetchDeliveryVehiclePackage(client, { deliveryPackageId: pkgId });
      setVehicles(vehs);
      const first = vehs[0];
      if (first) setSelectedVehicle(first);
      setStep('vehicle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [client, selectedPackage]);

  const updateDrop = useCallback((index: number, drop: Partial<DeliveryDrop>) => {
    setDrops((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return next;
      next[index] = {
        drop_latitude: drop.drop_latitude ?? current.drop_latitude,
        drop_longitude: drop.drop_longitude ?? current.drop_longitude,
        drop_location: drop.drop_location ?? current.drop_location,
        contact_name: drop.contact_name ?? current.contact_name,
        contact_phone: drop.contact_phone ?? current.contact_phone,
        instruction: drop.instruction ?? current.instruction,
      };
      return next;
    });
  }, []);

  const addDrop = useCallback(() => {
    setDrops((prev) => [
      ...prev,
      { drop_latitude: 0, drop_longitude: 0, drop_location: '', contact_name: '', contact_phone: '', instruction: '' },
    ]);
  }, []);

  const removeDrop = useCallback((index: number) => {
    setDrops((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const goToCheckout = useCallback(() => {
    if (!selectedProduct || !selectedVehicle || !selectedPackage) return;
    if (drops.some((d) => !d.drop_location)) return;
    setStep('checkout');
  }, [selectedProduct, selectedVehicle, selectedPackage, drops]);

  const runCheckout = useCallback(
    async (params: DeliveryCheckoutParams) => {
      if (!client) return null;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchDeliveryCheckout(client, {
          pickupLatitude: params.pickupLatitude,
          pickupLongitude: params.pickupLongitude,
          pickUpLocation: params.pickupLocation,
          drops: params.drops,
          productId: params.productId,
          categoryId: params.categoryId,
          deliveryPackageId: params.deliveryPackageId,
          weight: params.weight,
          vehicleType: params.vehicleType,
        });
        setCheckoutResult(result);
        if (result.estimate_fare_text) setCurrency(result.estimate_fare_text.replace(/[0-9.,]/g, '').trim() || '₹');
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to prepare delivery');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  const confirm = useCallback(async () => {
    if (!client || !checkoutResult) return;
    setLoading(true);
    setError(null);
    try {
      const result = await confirmDeliveryBooking(client, { checkoutId: checkoutResult.id });
      setBookingId(result.id);
      setStep('confirmed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to confirm delivery');
    } finally {
      setLoading(false);
    }
  }, [client, checkoutResult]);

  const reset = useCallback(() => {
    setStep('home');
    setLoading(false);
    setError(null);
    setSelectedPackage(null);
    setSelectedCategory(null);
    setProducts([]);
    setSelectedProduct(null);
    setVehicles([]);
    setSelectedVehicle(null);
    setDrops([
      { drop_latitude: 0, drop_longitude: 0, drop_location: '', contact_name: '', contact_phone: '', instruction: '' },
    ]);
    setPickupLocation('');
    setPickupLatitude(19.076);
    setPickupLongitude(72.877);
    setCheckoutResult(null);
    setBookingId(null);
  }, []);

  return {
    step,
    setStep,
    loading,
    error,
    currency,

    packages,
    selectedPackage,
    setSelectedPackage,

    categories,
    selectedCategory,
    selectCategory,

    products,
    selectedProduct,
    selectProduct,

    vehicles,
    selectedVehicle,
    setSelectedVehicle,

    drops,
    updateDrop,
    addDrop,
    removeDrop,

    pickupLocation,
    setPickupLocation,
    pickupLatitude,
    setPickupLatitude,
    pickupLongitude,
    setPickupLongitude,

    checkoutResult,
    setCheckoutResult,
    bookingId,

    runCheckout,
    confirm,
    reset,
  };
}

export type DeliveryFlow = ReturnType<typeof useDelivery>;
