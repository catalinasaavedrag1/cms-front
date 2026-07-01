import { CampaignDetail } from '@/features/cms/components/campaigns/CampaignDetail'
export default function Page({ params }: { params: { id: string } }) { return <CampaignDetail campaignId={params.id} /> }
