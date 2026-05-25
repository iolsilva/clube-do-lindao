"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { onlyDigits } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";

type DocumentType = "cpf" | "cnpj";

type CustomerFormValues = {
  id?: string;
  name: string;
  documentType: DocumentType;
  document: string;
  phone: string;
  levelId: string;
  active: boolean;
};

type RedemptionFormValues = {
  customerId: string;
  pointsToRedeem: string;
  redemptionDate: string;
  notes: string;
};

export type CustomerFormState = {
  message?: string;
  fieldErrors?: Partial<Record<keyof CustomerFormValues, string>>;
  values?: CustomerFormValues;
};

export type RedemptionFormState = {
  message?: string;
  fieldErrors?: Partial<Record<keyof RedemptionFormValues, string>>;
  values?: RedemptionFormValues;
};

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseCustomerForm(formData: FormData): CustomerFormValues {
  const rawDocumentType = getStringValue(formData, "documentType");
  const documentType: DocumentType =
    rawDocumentType === "cnpj" ? "cnpj" : "cpf";

  return {
    id: getStringValue(formData, "id") || undefined,
    name: getStringValue(formData, "name"),
    documentType,
    document: onlyDigits(getStringValue(formData, "document")),
    phone: onlyDigits(getStringValue(formData, "phone")),
    levelId: getStringValue(formData, "levelId"),
    active: formData.get("active") === "on",
  };
}

function validateCustomer(values: CustomerFormValues) {
  const fieldErrors: CustomerFormState["fieldErrors"] = {};

  if (!values.name) {
    fieldErrors.name = "Informe o nome completo.";
  }

  if (!values.document) {
    fieldErrors.document = "Informe o CPF ou CNPJ.";
  }

  if (!values.phone) {
    fieldErrors.phone = "Informe o telefone.";
  }

  return fieldErrors;
}

function getRedirectUrl(status: string) {
  return `/admin/clientes?status=${status}`;
}

function parseRedemptionForm(formData: FormData): RedemptionFormValues {
  return {
    customerId: getStringValue(formData, "customerId"),
    notes: getStringValue(formData, "notes"),
    pointsToRedeem: getStringValue(formData, "pointsToRedeem"),
    redemptionDate: getStringValue(formData, "redemptionDate"),
  };
}

function parseRedemptionDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function parsePointsValue(value: string) {
  const cleaned = value.replace(/[^\d,.]/g, "").trim();

  if (!cleaned) {
    return null;
  }

  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const points = Number(normalized);

  return Number.isFinite(points) ? points : null;
}

export async function saveCustomerAction(
  _previousState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const values = parseCustomerForm(formData);
  const fieldErrors = validateCustomer(values);

  if (Object.keys(fieldErrors ?? {}).length > 0) {
    return {
      message: "Revise os campos obrigatorios.",
      fieldErrors,
      values,
    };
  }

  const supabase = await createClient();

  let duplicateQuery = supabase
    .from("customers")
    .select("id")
    .eq("document", values.document)
    .limit(1);

  if (values.id) {
    duplicateQuery = duplicateQuery.neq("id", values.id);
  }

  const { data: duplicateCustomer, error: duplicateError } =
    await duplicateQuery.maybeSingle();

  if (duplicateError) {
    return {
      message: "Nao foi possivel validar o documento informado.",
      values,
    };
  }

  if (duplicateCustomer) {
    return {
      message: "Ja existe um cliente com este documento.",
      fieldErrors: {
        document: "Documento ja cadastrado.",
      },
      values,
    };
  }

  const payload = {
    name: values.name,
    document_type: values.documentType,
    document: values.document,
    phone: values.phone,
    level_id: values.levelId || null,
    active: values.active,
  };

  const response = values.id
    ? await supabase.from("customers").update(payload).eq("id", values.id)
    : await supabase.from("customers").insert(payload);

  if (response.error) {
    return {
      message:
        response.error.code === "23505"
          ? "Ja existe um cliente com este documento."
          : "Nao foi possivel salvar o cliente.",
      values,
    };
  }

  revalidatePath("/admin/clientes");
  redirect(getRedirectUrl(values.id ? "updated" : "created"));
}

export async function toggleCustomerStatusAction(formData: FormData) {
  const id = getStringValue(formData, "id");
  const active = getStringValue(formData, "active") === "true";

  if (!id) {
    redirect(getRedirectUrl("invalid"));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ active: !active })
    .eq("id", id);

  if (error) {
    redirect(getRedirectUrl("status-error"));
  }

  revalidatePath("/admin/clientes");
  redirect(getRedirectUrl(active ? "deactivated" : "activated"));
}

export async function redeemCustomerPointsAction(
  _previousState: RedemptionFormState,
  formData: FormData,
): Promise<RedemptionFormState> {
  const values = parseRedemptionForm(formData);
  const fieldErrors: RedemptionFormState["fieldErrors"] = {};
  const pointsToRedeem = parsePointsValue(values.pointsToRedeem);
  const redemptionDate = parseRedemptionDate(values.redemptionDate);

  if (!values.customerId) {
    fieldErrors.customerId = "Cliente inválido.";
  }

  if (pointsToRedeem === null || pointsToRedeem <= 0) {
    fieldErrors.pointsToRedeem = "Informe uma pontuação maior que zero.";
  }

  if (!redemptionDate) {
    fieldErrors.redemptionDate = "Informe a data do resgate.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: "Revise os dados do resgate.",
      fieldErrors,
      values,
    };
  }

  if (!values.customerId || pointsToRedeem === null || !redemptionDate) {
    return {
      message: "Revise os dados do resgate.",
      fieldErrors,
      values,
    };
  }

  const supabase = await createClient();
  const { data: customerPoints, error: pointsError } = await supabase
    .from("customer_points_view")
    .select("customer_id, available_points, total_points")
    .eq("customer_id", values.customerId)
    .maybeSingle();

  if (pointsError || !customerPoints) {
    return {
      message: "Não foi possível validar o saldo do cliente.",
      values,
    };
  }

  const availablePoints = Math.max(
    Number(
      customerPoints.available_points ?? customerPoints.total_points ?? 0,
    ),
    0,
  );

  if (pointsToRedeem > availablePoints) {
    return {
      message: "Pontos insuficientes para este resgate.",
      fieldErrors: {
        pointsToRedeem: `Saldo disponível: ${availablePoints.toLocaleString(
          "pt-BR",
          {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
          },
        )} pontos.`,
      },
      values,
    };
  }

  const redemptionPayload = {
    customer_id: values.customerId,
    notes: values.notes || null,
    points_spent: pointsToRedeem,
    points_used: pointsToRedeem,
    redeemed_at: redemptionDate,
    redemption_date: redemptionDate,
    reward_id: null,
    status: "completed",
  };

  const { error } = await supabase
    .from("reward_redemptions")
    .insert(redemptionPayload);

  if (
    error &&
    (error.code === "42703" ||
      error.code === "PGRST204" ||
      error.message?.includes("points_used") ||
      error.message?.includes("redemption_date"))
  ) {
    const { error: legacyError } = await supabase
      .from("reward_redemptions")
      .insert({
        customer_id: values.customerId,
        notes: values.notes || null,
        points_spent: pointsToRedeem,
        redeemed_at: redemptionDate,
        reward_id: null,
        status: "completed",
      });

    if (!legacyError) {
      revalidatePath("/admin/clientes");
      revalidatePath("/admin/dashboard");
      revalidatePath("/admin/ranking");
      redirect(getRedirectUrl("redeemed"));
    }
  }

  if (error) {
    return {
      message: "Não foi possível salvar o resgate.",
      values,
    };
  }

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/ranking");
  redirect(getRedirectUrl("redeemed"));
}
