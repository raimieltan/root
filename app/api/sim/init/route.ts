import { ScenarioMode } from "@/app/generated/prisma/enums";
import { initializeScenario } from "@/lib/simulation/initializer";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { mode?: string; blueProfileId?: string; definitionId?: string; assistance?: string };
    const mode = body.mode === ScenarioMode.BLUE ? ScenarioMode.BLUE : ScenarioMode.RED;
    const blueProfileId = typeof body.blueProfileId === "string" ? body.blueProfileId : undefined;
    const result = await initializeScenario(mode, body.definitionId ?? "glasshouse", blueProfileId, body.assistance === "OPERATOR" ? "OPERATOR" : "GUIDED");
    return Response.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Init error:", error);
    return Response.json(
      { success: false, error: "Failed to initialize scenario" },
      { status: 500 }
    );
  }
}
