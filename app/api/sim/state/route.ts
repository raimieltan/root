import { getScenarioView } from "@/lib/simulation/state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scenarioId = url.searchParams.get("scenarioId");
  const actorId = url.searchParams.get("actorId");
  if (!scenarioId || !actorId) return Response.json({ success: false, error: "Missing scenarioId or actorId" }, { status: 400 });
  const view = await getScenarioView(scenarioId, actorId);
  if (!view) return Response.json({ success: false, error: "Scenario not found" }, { status: 404 });
  return Response.json({ success: true, ...view });
}
