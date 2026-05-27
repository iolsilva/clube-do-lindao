"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/formatters";
import {
  requireAuthenticatedUser,
  type AppSupabaseClient,
} from "@/lib/auth/require-authenticated-user";

type LevelFormValues = {
  id?: string;
  name: string;
  description: string;
  sortOrder: string;
};

export type LevelFormState = {
  message?: string;
  fieldErrors?: Partial<Record<keyof LevelFormValues, string>>;
  values?: LevelFormValues;
};

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseLevelForm(formData: FormData): LevelFormValues {
  return {
    id: getStringValue(formData, "id") || undefined,
    name: getStringValue(formData, "name"),
    description: getStringValue(formData, "description"),
    sortOrder: getStringValue(formData, "sortOrder"),
  };
}

function parseSortOrder(value: string) {
  if (!value) {
    return 0;
  }

  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

async function getUniqueSlug(
  supabase: AppSupabaseClient,
  name: string,
  currentId?: string,
) {
  const baseSlug = slugify(name) || "nivel";
  const { data } = await supabase
    .from("levels")
    .select("id, slug")
    .ilike("slug", `${baseSlug}%`);
  const existingSlugs = new Set(
    (data ?? [])
      .filter((level) => level.id !== currentId)
      .map((level) => level.slug),
  );

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  let nextSlug = `${baseSlug}-${suffix}`;

  while (existingSlugs.has(nextSlug)) {
    suffix += 1;
    nextSlug = `${baseSlug}-${suffix}`;
  }

  return nextSlug;
}

function getRedirectUrl(status: string) {
  return `/admin/niveis?status=${status}`;
}

export async function saveLevelAction(
  _previousState: LevelFormState,
  formData: FormData,
): Promise<LevelFormState> {
  const values = parseLevelForm(formData);
  const fieldErrors: LevelFormState["fieldErrors"] = {};
  const sortOrder = parseSortOrder(values.sortOrder);

  if (!values.name) {
    fieldErrors.name = "Informe o nome do nivel.";
  }

  if (sortOrder === null) {
    fieldErrors.sortOrder = "Informe uma ordem numerica.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: "Revise os campos do nivel.",
      fieldErrors,
      values,
    };
  }

  if (sortOrder === null) {
    return {
      message: "Revise os campos do nivel.",
      fieldErrors,
      values,
    };
  }

  const { error: authError, supabase } = await requireAuthenticatedUser();

  if (authError) {
    return {
      message: authError,
      values,
    };
  }

  const slug = await getUniqueSlug(supabase, values.name, values.id);
  const payload = {
    active: true,
    benefit_description: values.description || null,
    min_points: 0,
    name: values.name,
    slug,
    sort_order: sortOrder,
  };
  const response = values.id
    ? await supabase.from("levels").update(payload).eq("id", values.id)
    : await supabase.from("levels").insert(payload);

  if (response.error) {
    return {
      message: "Nao foi possivel salvar o nivel.",
      values,
    };
  }

  revalidatePath("/admin/niveis");
  revalidatePath("/admin/clientes");
  revalidatePath("/ranking");
  redirect(getRedirectUrl(values.id ? "updated" : "created"));
}

export async function deleteLevelAction(formData: FormData) {
  const id = getStringValue(formData, "id");

  if (!id) {
    redirect(getRedirectUrl("invalid"));
  }

  const { error: authError, supabase } = await requireAuthenticatedUser();

  if (authError) {
    redirect(getRedirectUrl("auth-error"));
  }

  const { count, error: countError } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("level_id", id);

  if (countError) {
    redirect(getRedirectUrl("delete-error"));
  }

  if ((count ?? 0) > 0) {
    redirect(getRedirectUrl("in-use"));
  }

  const { error } = await supabase.from("levels").delete().eq("id", id);

  if (error) {
    redirect(getRedirectUrl("delete-error"));
  }

  revalidatePath("/admin/niveis");
  revalidatePath("/admin/clientes");
  revalidatePath("/ranking");
  redirect(getRedirectUrl("deleted"));
}
