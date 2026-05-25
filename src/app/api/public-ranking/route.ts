import { NextResponse } from "next/server";
import { getPublicRanking } from "@/lib/public-ranking";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? "";
  const result = await getPublicRanking(search);

  if (result.error) {
    return NextResponse.json(
      { data: [], error: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: result.ranking,
    error: null,
  });
}
