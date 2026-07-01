import { BannerEditor } from '@/features/cms/components/banners/BannerEditor'
export default function Page({ params }: { params: { id: string } }) { return <BannerEditor bannerId={params.id} /> }
