import { redirect } from "next/navigation";

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/video/${id}/subtitles`);
}
