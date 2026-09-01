import { ChildSessionReview } from "@/components/child-session-review";

export default async function ChildSessionReviewPage({ params }: { params: Promise<{ sessionId: string }> }) { const { sessionId } = await params; return <ChildSessionReview sessionId={sessionId} />; }
