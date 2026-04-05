import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const barcode = body.barcode as string;

  if (!barcode || typeof barcode !== "string") {
    return NextResponse.json({ error: "Missing barcode" }, { status: 400 });
  }

  const cleaned = barcode.replace(/\s/g, "");
  if (!/^\d{8,14}$/.test(cleaned)) {
    return NextResponse.json({ error: "Invalid barcode format" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleaned)}?fields=product_name,brands,nutriments,image_url`,
      {
        headers: { "User-Agent": "GymTracker/1.0" },
        signal: AbortSignal.timeout(12000),
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      console.error(`Open Food Facts API error: ${res.status} ${res.statusText} for barcode ${cleaned}`);
      return NextResponse.json(
        { error: `Upstream API error (${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.product || data.status === 0) {
      return NextResponse.json({ error: "Product not found in database" }, { status: 404 });
    }

    const p = data.product;
    const n = p.nutriments || {};

    return NextResponse.json({
      product_name: p.product_name || "Unknown product",
      brand: p.brands || null,
      barcode: cleaned,
      calories: Math.round(n["energy-kcal_100g"] || 0),
      protein: Math.round((n["proteins_100g"] || 0) * 10) / 10,
      carbs: Math.round((n["carbohydrates_100g"] || 0) * 10) / 10,
      fat: Math.round((n["fat_100g"] || 0) * 10) / 10,
      fiber: Math.round((n["fiber_100g"] || 0) * 10) / 10,
      sugar: Math.round((n["sugars_100g"] || 0) * 10) / 10,
      saturated_fat: Math.round((n["saturated-fat_100g"] || 0) * 10) / 10,
      sodium: Math.round((n["sodium_100g"] || 0) * 1000) / 10,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.includes("abort") || message.includes("timeout");
    console.error(`Barcode lookup failed for ${cleaned}: ${message}`);
    return NextResponse.json(
      { error: isTimeout ? "Request timed out. Please try again." : "Failed to look up product." },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
