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

export type CustomerFormState = {
  message?: string;
  fieldErrors?: Partial<Record<keyof CustomerFormValues, string>>;
  values?: CustomerFormValues;
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
