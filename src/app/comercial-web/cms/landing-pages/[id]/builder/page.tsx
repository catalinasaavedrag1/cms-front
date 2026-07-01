import { LandingVisualBuilder } from '@/features/cms/components/landing-pages/LandingVisualBuilder'
export default function Page({ params }: { params: { id: string } }) { return <LandingVisualBuilder landingId={params.id} /> }
