import { campaign, operationPresentation } from "@/lib/simulation/scenarios";
export function GET() { return Response.json({ operations: campaign.map(operationPresentation) }); }
