import type { Metadata } from 'next';

import { CmsPageView } from '@/components/cms/cms-page-view';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: decodeURIComponent(slug).replace(/-/g, ' ') };
}

export default async function CmsPageEntry({ params }: Props): Promise<React.ReactNode> {
  const { slug } = await params;
  return <CmsPageView slug={slug} />;
}