"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  calculatePointsFromCents,
  parseCurrencyToCents,
} from "@/lib/formatters";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

type PurchaseFormValues = {
  customerId: string;
  purchaseId: string;
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
    purchaseId: getStringValue(formData, "purchaseId"),
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

function validatePurchaseValues(values: PurchaseFormValues) {
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

  return {
    amountCents,
    fieldErrors,
    purchasedAt,
  };
}

function revalidatePurchaseViews() {
  revalidatePath("/admin/compras");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/ranking");
  revalidatePath("/ranking");
}

function getPurchasesRedirect(status: string, customerId?: string) {
  const params = new URLSearchParams({ status });

  if (customerId) {
    params.set("customerId", customerId);
  }

  return `/admin/compras?${params.toString()}`;
}

async function ensureCustomerCanReceivePurchase(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],
  customerId: string,
  values: PurchaseFormValues,
) {
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, active")
    .eq("id", customerId)
    .maybeSingle();

  if (customerError || !customer) {
    return {
      message: "Cliente nao encontrado.",
      state: {
        message: "Cliente nao encontrado.",
        fieldErrors: {
          customerId: "Selecione um cliente valido.",
        },
        values,
      },
    };
  }

  if (!customer.active) {
    return {
      message: "Nao e possivel registrar compra para cliente inativo.",
      state: {
        message: "Nao e possivel registrar compra para cliente inativo.",
        fieldErrors: {
          customerId: "Cliente inativo.",
        },
        values,
      },
    };
  }

  return null;
}

export async function createPurchaseAction(
  _previousState: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  const values = parsePurchaseForm(formData);
  const { amountCents, fieldErrors, purchasedAt } =
    validatePurchaseValues(values);

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

  const { error: authError, supabase } = await requireAuthenticatedUser();

  if (authError) {
    return {
      message: authError,
      values,
    };
  }

  const customerError = await ensureCustomerCanReceivePurchase(
    supabase,
    values.customerId,
    values,
  );

  if (customerError) {
    return customerError.state;
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

  revalidatePurchaseViews();
  redirect(getPurchasesRedirect("created", values.customerId));
}

export async function updatePurchaseAction(
  _previousState: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  const values = parsePurchaseForm(formData);
  const { amountCents, fieldErrors, purchasedAt } =
    validatePurchaseValues(values);

  if (!values.purchaseId) {
    fieldErrors.purchaseId = "Compra invalida.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: "Revise os campos da compra.",
      fieldErrors,
      values,
    };
  }

  if (
    !values.purchaseId ||
    !values.customerId ||
    !purchasedAt ||
    amountCents === null
  ) {
    return {
      message: "Revise os campos da compra.",
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

  const customerError = await ensureCustomerCanReceivePurchase(
    supabase,
    values.customerId,
    values,
  );

  if (customerError) {
    return customerError.state;
  }

  const pointsGenerated = calculatePointsFromCents(amountCents);

  if (!Number.isFinite(pointsGenerated) || pointsGenerated <= 0) {
    return {
      message: "Nao foi possivel calcular os pontos da compra.",
      values,
    };
  }

  const { data: updatedPurchase, error } = await supabase
    .from("purchases")
    .update({
      amount_cents: amountCents,
      customer_id: values.customerId,
      notes: values.notes || null,
      purchased_at: purchasedAt,
    })
    .eq("id", values.purchaseId)
    .select("id")
    .maybeSingle();

  if (error || !updatedPurchase) {
    return {
      message: "Nao foi possivel atualizar a compra.",
      values,
    };
  }

  revalidatePurchaseViews();
  redirect(getPurchasesRedirect("updated", values.customerId));
}

export async function deletePurchaseAction(formData: FormData) {
  const purchaseId = getStringValue(formData, "purchaseId");
  const customerId = getStringValue(formData, "customerId");

  if (!purchaseId) {
    redirect(getPurchasesRedirect("invalid", customerId));
  }

  const { error: authError, supabase } = await requireAuthenticatedUser();

  if (authError) {
    redirect(getPurchasesRedirect("auth-error", customerId));
  }

  const { data: deletedPurchase, error } = await supabase
    .from("purchases")
    .delete()
    .eq("id", purchaseId)
    .select("id")
    .maybeSingle();

  if (error || !deletedPurchase) {
    redirect(getPurchasesRedirect("delete-error", customerId));
  }

  revalidatePurchaseViews();
  redirect(getPurchasesRedirect("deleted", customerId));
}
