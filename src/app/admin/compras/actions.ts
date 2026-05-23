"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  calculatePointsFromCents,
  parseCurrencyToCents,
} from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";

type PurchaseFormValues = {
  customerId: string;
  purchasedAt: string;
  totalAmount: string;
  notes: string;
};

export type PurchaseFormState = {
  message?: string;
  fieldErrors?: Partial<Record<keyof PurchaseFormValues, string>>;
  values?: PurchaseFormValues;
};

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parsePurchaseForm(formData: FormData): PurchaseFormValues {
  return {
    customerId: getStringValue(formData, "customerId"),
    purchasedAt: getStringValue(formData, "purchasedAt"),
    totalAmount: getStringValue(formData, "totalAmount"),
    notes: getStringValue(formData, "notes"),
  };
}

function parsePurchasedAt(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export async function createPurchaseAction(
  _previousState: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  const values = parsePurchaseForm(formData);
  const fieldErrors: PurchaseFormState["fieldErrors"] = {};
  const amountCents = parseCurrencyToCents(values.totalAmount);
  const purchasedAt = parsePurchasedAt(values.purchasedAt);

  if (!values.customerId) {
    fieldErrors.customerId = "Selecione um cliente.";
  }

  if (!purchasedAt) {
    fieldErrors.purchasedAt = "Informe a data e hora da compra.";
  }

  if (!amountCents) {
    fieldErrors.totalAmount = "Informe um valor total maior que zero.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: "Revise os campos da compra.",
      fieldErrors,
      values,
    };
  }

  if (!values.customerId || !purchasedAt || amountCents === null) {
    return {
      message: "Revise os campos da compra.",
      fieldErrors,
      values,
    };
  }

  const supabase = await createClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, active")
    .eq("id", values.customerId)
    .maybeSingle();

  if (customerError || !customer) {
    return {
      message: "Cliente nao encontrado.",
      fieldErrors: {
        customerId: "Selecione um cliente valido.",
      },
      values,
    };
  }

  if (!customer.active) {
    return {
      message: "Nao e possivel registrar compra para cliente inativo.",
      fieldErrors: {
        customerId: "Cliente inativo.",
      },
      values,
    };
  }

  const pointsGenerated = calculatePointsFromCents(amountCents);

  if (!Number.isFinite(pointsGenerated) || pointsGenerated <= 0) {
    return {
      message: "Nao foi possivel calcular os pontos da compra.",
      values,
    };
  }

  const { error } = await supabase.from("purchases").insert({
    amount_cents: amountCents,
    customer_id: values.customerId,
    notes: values.notes || null,
    purchased_at: purchasedAt,
  });

  if (error) {
    return {
      message: "Nao foi possivel salvar a compra.",
      values,
    };
  }

  revalidatePath("/admin/compras");
  revalidatePath("/admin/ranking");
  revalidatePath("/ranking");
  redirect(`/admin/compras?customerId=${values.customerId}&status=created`);
}
