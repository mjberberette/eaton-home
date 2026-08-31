import { NextResponse } from "next/server";
import { demoPriceCheck } from "@/lib/pricing/demo";
import { serpApiPriceCheck } from "@/lib/pricing/serpapi";

export async function POST(request: Request) {
  let body: { query?: unknown; basePrice?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const basePrice = typeof body.basePrice === "number" ? body.basePrice : undefined;
  if (!query) {
    return NextResponse.json({ error: "A search query is required" }, { status: 400 });
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (apiKey) {
    try {
      const result = await serpApiPriceCheck(query, apiKey);
      if (result.offers.length > 0) return NextResponse.json(result);
    } catch {
      // Live lookup failed — fall through to the estimator so the UI still works.
    }
  }

  return NextResponse.json(demoPriceCheck(query, basePrice));
}
