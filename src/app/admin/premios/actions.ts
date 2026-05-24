"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type RewardFormValues = {
  id?: string;
  title: string;
  description: string;
  pointsRequired: string;
  active: boolean;
};

export type RewardFormState = {
  message?: string;
  fieldErrors?: Partial<Record<keyof RewardFormValues, string>>;
  values?: RewardFormValues;
};

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parsePoints(value: string) {
  const cleaned = value.replace(/[^\d,.]/g, "").trim();

  if (!cleaned) {
    return null;
  }

  let normalized = cleaned;

  if (cleaned.includes(",")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if ((cleaned.match(/\./g) ?? []).length > 1) {
    normalized = cleaned.replace(/\./g, "");
  }

  const points = Number(normalized);

  if (!Number.isFinite(points) || points <= 0) {
    return null;
  }

  return points;
}

function parseRewardForm(formData: FormData): RewardFormValues {
  return {
    active: formData.get("active") === "on",
    description: getStringValue(formData, "description"),
    id: getStringValue(formData, "id") || undefined,
    pointsRequired: getStringValue(formData, "pointsRequired"),
    title: getStringValue(formData, "title"),
  };
}

function getRedirectUrl(status: string) {
  return `/admin/premios?status=${status}`;
}

export async function saveRewardAction(
  _previousState: RewardFormState,
  formData: FormData,
): Promise<RewardFormState> {
  const values = parseRewardForm(formData);
  const pointsRequired = parsePoints(values.pointsRequired);
  const fieldErrors: RewardFormState["fieldErrors"] = {};

  if (!values.title) {
    fieldErrors.title = "Informe o titulo do premio.";
  }

  if (pointsRequired === null) {
    fieldErrors.pointsRequired = "Informe os pontos necessarios.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: "Revise os campos do premio.",
      fieldErrors,
      values,
    };
  }

  if (pointsRequired === null) {
    return {
      message: "Revise os campos do premio.",
      fieldErrors,
      values,
    };
  }

  const supabase = await createClient();
  const payload = {
    active: values.active,
    description: values.description || null,
    name: values.title,
    points_required: pointsRequired,
  };
  const response = values.id
    ? await supabase.from("rewards").update(payload).eq("id", values.id)
    : await supabase.from("rewards").insert(payload);

  if (response.error) {
    return {
      message: "Nao foi possivel salvar o premio.",
      values,
    };
  }

  revalidatePath("/admin/premios");
  revalidatePath("/premios");
  redirect(getRedirectUrl(values.id ? "updated" : "created"));
}

export async function toggleRewardStatusAction(formData: FormData) {
  const id = getStringValue(formData, "id");
  const active = getStringValue(formData, "active") === "true";

  if (!id) {
    redirect(getRedirectUrl("invalid"));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("rewards")
    .update({ active: !active })
    .eq("id", id);

  if (error) {
    redirect(getRedirectUrl("status-error"));
  }

  revalidatePath("/admin/premios");
  revalidatePath("/premios");
  redirect(getRedirectUrl(active ? "deactivated" : "activated"));
}
