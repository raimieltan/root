import { HintRequestError, requestHint } from "@/lib/simulation/hints";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const view = await requestHint({
      scenarioId: typeof body.scenarioId === "string" ? body.scenarioId : "",
      actorId: typeof body.actorId === "string" ? body.actorId : "",
      objectiveId: typeof body.objectiveId === "string" ? body.objectiveId : "",
      tier: typeof body.tier === "number" ? body.tier : undefined,
    });
    return Response.json(view);
  } catch (error) {
    const status = error instanceof HintRequestError ? error.status : 500;
    if (!(error instanceof HintRequestError)) console.error("Hint request error", error);
    return Response.json({ success: false, error: error instanceof Error ? error.message : "Unable to request hint" }, { status });
  }
}
