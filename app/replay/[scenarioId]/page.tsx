import ReplayClient from "./replay-client";

type ReplayPageProps = {
  params: Promise<{ scenarioId: string }>;
  searchParams: Promise<{ actor?: string | string[] }>;
};

export default async function ReplayPage({ params, searchParams }: ReplayPageProps) {
  const { scenarioId } = await params;
  const query = await searchParams;
  return <ReplayClient scenarioId={scenarioId} actorId={typeof query.actor === "string" ? query.actor : undefined} />;
}
