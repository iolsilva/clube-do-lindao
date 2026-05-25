import { createClient } from "@/lib/supabase/server";

export type PublicRankingRow = {
  position: number;
  customer_code: string | null;
  customer_name: string;
  level_name: string | null;
  total_points: string | number;
};

type SearchPublicRankingRow = {
  rank_position?: number;
  position?: number;
  full_name?: string;
  customer_name?: string;
  customer_code: string | null;
  level_name: string | null;
  total_points: string | number;
};

type PublicRankingResult = {
  error: string | null;
  fullRanking: PublicRankingRow[];
  ranking: PublicRankingRow[];
};

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function matchesPublicFields(customer: PublicRankingRow, search: string) {
  const normalizedSearch = normalizeSearch(search);

  if (!normalizedSearch) {
    return true;
  }

  return (
    customer.customer_name.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
    (customer.customer_code ?? "")
      .toLocaleLowerCase("pt-BR")
      .includes(normalizedSearch)
  );
}

function mapSearchResult(row: SearchPublicRankingRow): PublicRankingRow {
  return {
    position: row.rank_position ?? row.position ?? 0,
    customer_code: row.customer_code,
    customer_name: row.full_name ?? row.customer_name ?? "",
    level_name: row.level_name,
    total_points: row.total_points,
  };
}

async function searchRankingByRpc(
  supabase: Awaited<ReturnType<typeof createClient>>,
  search: string,
) {
  const searchResult = await supabase.rpc("search_public_ranking", {
    search_text: search,
  });

  if (!searchResult.error) {
    return searchResult;
  }

  const legacyResult = await supabase.rpc("search_public_ranking", {
    search_term: search,
  });

  if (!legacyResult.error) {
    return legacyResult;
  }

  return searchResult;
}

export async function getPublicRanking(
  search = "",
): Promise<PublicRankingResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_ranking_view")
    .select("position, customer_code, customer_name, level_name, total_points")
    .order("position", { ascending: true })
    .order("customer_name", { ascending: true });

  if (error) {
    console.error("Failed to load public ranking", error);

    return {
      error: "Não foi possível carregar o ranking.",
      fullRanking: [],
      ranking: [],
    };
  }

  const fullRanking = (data ?? []) as PublicRankingRow[];
  const cleanSearch = search.trim();

  if (!cleanSearch) {
    return {
      error: null,
      fullRanking,
      ranking: fullRanking,
    };
  }

  const searchResult = await searchRankingByRpc(supabase, cleanSearch);

  if (!searchResult.error) {
    return {
      error: null,
      fullRanking,
      ranking: ((searchResult.data ?? []) as SearchPublicRankingRow[]).map(
        mapSearchResult,
      ),
    };
  }

  console.error("Failed to search public ranking", searchResult.error);

  return {
    error: null,
    fullRanking,
    ranking: fullRanking.filter((customer) =>
      matchesPublicFields(customer, cleanSearch),
    ),
  };
}
