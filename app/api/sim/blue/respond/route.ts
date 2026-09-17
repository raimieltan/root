import { respondToAttack } from "@/lib/simulation/blue";

export async function POST(request: Request) {
  try {
    return Response.json(await respondToAttack(await request.json()));
  } catch (error) {
    console.error("Blue response error", error);
    return Response.json({ success: false, error: "Unable to apply response" }, { status: 400 });
  }
}
