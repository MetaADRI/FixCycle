import { Suspense } from 'react';

import { LaunchScreen } from '@/components/launch-screen';

export default function HomePage(): React.ReactNode {
  return (
    <Suspense>
      <LaunchScreen />
    </Suspense>
  );
}