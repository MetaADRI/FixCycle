import { Suspense } from 'react';

import { DriverLaunchScreen } from '@/components/driver-launch-screen';

export default function HomePage(): React.ReactNode {
  return (
    <Suspense>
      <DriverLaunchScreen />
    </Suspense>
  );
}