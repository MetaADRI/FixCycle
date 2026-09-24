'use client';

import { useMemo, useState } from 'react';
import { Button, Icon, Spinner } from '@fixcycle/ui';

import { t } from '@/lib/i18n';
import type { DeliveryFlow } from '@/lib/delivery/use-delivery';

export function DeliveryView({ flow }: { flow: DeliveryFlow }): React.ReactNode {
  switch (flow.step) {
    case 'home':
      return <HomeStep flow={flow} />;
    case 'category':
      return <CategoryStep flow={flow} />;
    case 'product':
      return <ProductStep flow={flow} />;
    case 'vehicle':
      return <VehicleStep flow={flow} />;
    case 'checkout':
      return <CheckoutStep flow={flow} />;
    case 'confirmed':
      return <ConfirmedStep flow={flow} />;
    default:
      return <HomeStep flow={flow} />;
  }
}

function HomeStep({ flow }: { flow: DeliveryFlow }): React.ReactNode {
  const { packages, loading, selectedPackage, setSelectedPackage } = flow;
  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
        <div className="mb-1 flex items-center gap-2">
          <Icon name="delivery" size={20} className="text-[var(--fc-bg-secondary)]" />
          <h2 className="text-base font-bold text-[var(--fc-text-primary)]">{t('delivery.title', 'en')}</h2>
        </div>
        <p className="text-sm text-[var(--fc-text-secondary)]">{t('delivery.subtitle', 'en')}</p>
      </div>

      <section>
        <h2 className="mb-2 px-1 text-sm font-bold text-[var(--fc-text-primary)]">{t('delivery.choosePackage', 'en')}</h2>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : packages.length === 0 ? (
          <p className="text-sm text-[var(--fc-text-secondary)]">{t('delivery.loading', 'en')}</p>
        ) : (
          <ul className="space-y-2">
            {packages.map((pkg) => {
              const active = selectedPackage?.id === pkg.id;
              return (
                <li key={pkg.id}>
                  <button
                    onClick={() => setSelectedPackage(pkg)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      active
                        ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)]/5'
                        : 'border-[var(--fc-border)] bg-[var(--fc-surface-raised)]'
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--fc-surface)] text-[var(--fc-bg-secondary)]">
                      <Icon name="delivery" size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[var(--fc-text-primary)]">{pkg.package_name}</span>
                      <span className="block text-xs text-[var(--fc-text-secondary)]">
                        {t('delivery.packageWeight', 'en')} {pkg.dead_weight} kg · {t('delivery.packageSize', 'en')}{' '}
                        {pkg.package_length}×{pkg.package_width}×{pkg.package_height} cm
                      </span>
                    </span>
                    {active ? <Icon name="check" size={18} className="text-[var(--fc-bg-secondary)]" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Button block variant="primary" disabled={!selectedPackage} onClick={() => flow.setStep('category')}>
        {t('delivery.continue', 'en')}
      </Button>
    </div>
  );
}

function CategoryStep({ flow }: { flow: DeliveryFlow }): React.ReactNode {
  const { categories, loading, selectCategory } = flow;
  return (
    <div className="flex flex-col gap-4 px-4">
      <h2 className="text-base font-bold text-[var(--fc-text-primary)]">{t('delivery.chooseCategory', 'en')}</h2>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : categories.length === 0 ? (
        <p className="text-sm text-[var(--fc-text-secondary)]">{t('delivery.loading', 'en')}</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => void selectCategory(cat)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[var(--fc-text-primary)]">{cat.category_name}</span>
                </span>
                <Icon name="chevron-right" size={18} className="text-[var(--fc-text-secondary)]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductStep({ flow }: { flow: DeliveryFlow }): React.ReactNode {
  const { products, loading, selectProduct } = flow;
  return (
    <div className="flex flex-col gap-4 px-4">
      <h2 className="text-base font-bold text-[var(--fc-text-primary)]">{t('delivery.chooseProduct', 'en')}</h2>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-[var(--fc-text-secondary)]">{t('delivery.loading', 'en')}</p>
      ) : (
        <ul className="space-y-2">
          {products.map((prod) => (
            <li key={prod.id}>
              <button
                onClick={() => void selectProduct(prod)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[var(--fc-text-primary)]">{prod.product_name}</span>
                  {prod.description ? (
                    <span className="block truncate text-xs text-[var(--fc-text-secondary)]">{prod.description}</span>
                  ) : null}
                </span>
                <span className="text-right">
                  <span className="block text-sm font-bold text-[var(--fc-text-primary)]">
                    {t('delivery.productPrice', 'en')} {prod.price}
                  </span>
                  <span className="block text-xs text-[var(--fc-text-secondary)]">{prod.weight} kg</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VehicleStep({ flow }: { flow: DeliveryFlow }): React.ReactNode {
  const { vehicles, loading, selectedVehicle, setSelectedVehicle } = flow;
  return (
    <div className="flex flex-col gap-4 px-4">
      <h2 className="text-base font-bold text-[var(--fc-text-primary)]">{t('delivery.chooseVehicle', 'en')}</h2>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : vehicles.length === 0 ? (
        <p className="text-sm text-[var(--fc-text-secondary)]">{t('delivery.loading', 'en')}</p>
      ) : (
        <ul className="space-y-2">
          {vehicles.map((veh) => {
            const active = selectedVehicle?.vehicle_type_id === veh.vehicle_type_id;
            return (
              <li key={veh.vehicle_type_id}>
                <button
                  onClick={() => setSelectedVehicle(veh)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    active
                      ? 'border-[var(--fc-bg-secondary)] bg-[var(--fc-bg-secondary)]/5'
                      : 'border-[var(--fc-border)] bg-[var(--fc-surface-raised)]'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[var(--fc-text-primary)]">{veh.vehicle_type_name}</span>
                    <span className="block text-xs text-[var(--fc-text-secondary)]">
                      {t('delivery.vehicleCapacity', 'en')} {veh.capacity_kg} kg
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--fc-text-primary)]">{veh.ride_fare_text || `K ${veh.ride_fare}`}</span>
                    {active ? <Icon name="check" size={18} className="text-[var(--fc-bg-secondary)]" /> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Button block variant="primary" disabled={!selectedVehicle} onClick={() => flow.setStep('checkout')}>
        {t('delivery.continue', 'en')}
      </Button>
    </div>
  );
}

function CheckoutStep({ flow }: { flow: DeliveryFlow }): React.ReactNode {
  const {
    loading,
    pickupLocation,
    setPickupLocation,
    drops,
    updateDrop,
    addDrop,
    removeDrop,
    selectedProduct,
    selectedVehicle,
    selectedPackage,
    checkoutResult,
    runCheckout,
    confirm,
  } = flow;

  const [confirming, setConfirming] = useState(false);

  const ready = useMemo(
    () => pickupLocation.trim() !== '' && drops.length > 0 && drops.every((d) => d.drop_location.trim() !== ''),
    [pickupLocation, drops],
  );

  const startCheckout = () => {
    if (!ready || !selectedProduct || !selectedVehicle || !selectedPackage) return;
    void runCheckout({
      pickupLocation,
      pickupLatitude: flow.pickupLatitude,
      pickupLongitude: flow.pickupLongitude,
      drops: drops.map((d) => ({ ...d })),
      productId: selectedProduct.id,
      categoryId: selectedProduct.category_id,
      deliveryPackageId: selectedPackage.id,
      weight: selectedProduct.weight,
      vehicleType: selectedVehicle.vehicle_type_id,
    });
  };

  const proceedToConfirm = () => {
    setConfirming(true);
    void confirm().finally(() => setConfirming(false));
  };

  return (
    <div className="flex flex-col gap-4 px-4">
      <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
        <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('delivery.pickup', 'en')}</h2>
        <input
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          placeholder={t('delivery.pickupPlaceholder', 'en')}
          className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
        />
      </section>

      <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
        <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('delivery.dropPoints', 'en')}</h2>
        <ul className="space-y-3">
          {drops.map((drop, i) => (
            <li key={i} className="space-y-2 rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-3">
              <div className="flex items-center gap-2">
                <Icon name="delivery" size={16} className="text-[var(--fc-bg-secondary)]" />
                <span className="flex-1 text-xs font-semibold text-[var(--fc-text-secondary)]">
                  {t('delivery.dropLocation', 'en')} {i + 1}
                </span>
                {drops.length > 1 ? (
                  <button onClick={() => removeDrop(i)} className="text-xs font-semibold text-[var(--fc-danger)]">
                    {t('delivery.removeStop', 'en')}
                  </button>
                ) : null}
              </div>
              <input
                value={drop.drop_location}
                onChange={(e) => updateDrop(i, { drop_location: e.target.value })}
                placeholder={t('delivery.dropLocation', 'en')}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={drop.contact_name}
                  onChange={(e) => updateDrop(i, { contact_name: e.target.value })}
                  placeholder={t('delivery.contactName', 'en')}
                  className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
                />
                <input
                  value={drop.contact_phone}
                  onChange={(e) => updateDrop(i, { contact_phone: e.target.value })}
                  placeholder={t('delivery.contactPhone', 'en')}
                  className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
                />
              </div>
              <input
                value={drop.instruction}
                onChange={(e) => updateDrop(i, { instruction: e.target.value })}
                placeholder={t('delivery.instruction', 'en')}
                className="w-full rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-3 py-2 text-sm text-[var(--fc-text-primary)] outline-none placeholder:text-[var(--fc-text-secondary)]"
              />
            </li>
          ))}
        </ul>
        <button onClick={addDrop} className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--fc-bg-secondary)]">
          <Icon name="clock" size={16} className="rotate-45" />
          {t('delivery.addStop', 'en')}
        </button>
      </section>

      {checkoutResult ? (
        <>
          <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] p-4">
            <h2 className="mb-2 text-sm font-bold text-[var(--fc-text-primary)]">{t('delivery.fareSummary', 'en')}</h2>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-[var(--fc-text-secondary)]">{t('delivery.estimateFare', 'en')}</span>
                <span className="font-semibold text-[var(--fc-text-primary)]">
                  K {checkoutResult.estimate_fare}
                </span>
              </li>
            </ul>
          </section>
          <Button block variant="primary" loading={confirming} onClick={proceedToConfirm}>
            {t('delivery.confirm', 'en')}
          </Button>
        </>
      ) : (
        <Button block variant="primary" loading={loading} disabled={!ready} onClick={startCheckout}>
          {t('delivery.continue', 'en')}
        </Button>
      )}
    </div>
  );
}

function ConfirmedStep({ flow }: { flow: DeliveryFlow }): React.ReactNode {
  return (
    <div className="flex flex-col items-center gap-4 px-6 pt-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--fc-bg-secondary)]/10 text-[var(--fc-bg-secondary)]">
        <Icon name="check" size={32} />
      </span>
      <h2 className="text-lg font-bold text-[var(--fc-text-primary)]">{t('delivery.confirmedTitle', 'en')}</h2>
      <p className="text-sm text-[var(--fc-text-secondary)]">{t('delivery.successMessage', 'en')}</p>
      {flow.bookingId ? (
        <p className="rounded-xl border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--fc-text-primary)]">
          #{flow.bookingId}
        </p>
      ) : null}
      <Button block variant="primary" onClick={() => flow.reset()}>
        {t('delivery.done', 'en')}
      </Button>
    </div>
  );
}