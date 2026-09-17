import { advanceBlueScenario } from "@/lib/simulation/blue";

export async function POST(request: Request) {
  try {
    const { scenarioId, actorId } = await request.json() as { scenarioId?: string; actorId?: string };
    if (!scenarioId || !actorId) return Response.json({ success: false, error: "Missing fields" }, { status: 400 });
    return Response.json({ success: true, ...(await advanceBlueScenario(scenarioId, actorId)) });
  } catch (error) {
    console.error("Blue advance error", error);
    return Response.json({ success: false, error: "Unable to advance scenario" }, { status: 500 });
  }
}
