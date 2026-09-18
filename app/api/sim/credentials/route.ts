import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const scenarioId = typeof body.scenarioId === "string" ? body.scenarioId : "";
    const actorId = typeof body.actorId === "string" ? body.actorId : "";
    const credentialId = typeof body.credentialId === "string" ? body.credentialId : "";
    const action = body.action === "REVEAL" || body.action === "USE" ? body.action : undefined;
    if (!scenarioId || !actorId || !credentialId || !action) return Response.json({ success: false, error: "Invalid credential request" }, { status: 400 });
    const actor = await prisma.actor.findFirst({ where: { id: actorId, scenarioId, role: { in: ["red_operator", "red_ai"] } } });
    const credential = await prisma.credential.findFirst({ where: { id: credentialId, scenarioId } });
    if (!actor || !credential) return Response.json({ success: false, error: "Credential unavailable" }, { status: 404 });
    if (action === "REVEAL") return Response.json({ success: true, secret: credential.valid ? credential.secret ?? "No password material recorded." : "Credential invalidated." });
    const command = credential.serviceName === "postgres"
      ? `psql -h ${credential.knownScope} -U ${credential.username} -d ${credential.databaseName ?? "postgres"}`
      : `ssh ${credential.username}@${credential.knownScope}`;
    return Response.json({ success: true, command, valid: credential.valid });
  } catch {
    return Response.json({ success: false, error: "Failed to load credential" }, { status: 500 });
  }
}
