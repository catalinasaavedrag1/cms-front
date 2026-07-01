import type { ReactNode } from 'react'
import { CmsShell } from '@/features/cms/components/layout/CmsShell'

export default function CmsSectionLayout({ children }: { children: ReactNode }) {
  return <CmsShell>{children}</CmsShell>
}
