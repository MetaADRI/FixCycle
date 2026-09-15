import type { ReactNode } from 'react';

import { BookingIllustration, FastBookingIllustration, VerifiedIllustration } from '@/components/onboarding/illustrations';

export interface OnboardingSlide {
  id: string;
  titleKey: 'onboard.slide1Title' | 'onboard.slide2Title' | 'onboard.slide3Title';
  bodyKey: 'onboard.slide1Body' | 'onboard.slide2Body' | 'onboard.slide3Body';
  Illustration: (props: { className?: string }) => ReactNode;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'professionals',
    titleKey: 'onboard.slide1Title',
    bodyKey: 'onboard.slide1Body',
    Illustration: BookingIllustration,
  },
  {
    id: 'verified',
    titleKey: 'onboard.slide2Title',
    bodyKey: 'onboard.slide2Body',
    Illustration: VerifiedIllustration,
  },
  {
    id: 'booking',
    titleKey: 'onboard.slide3Title',
    bodyKey: 'onboard.slide3Body',
    Illustration: FastBookingIllustration,
  },
];