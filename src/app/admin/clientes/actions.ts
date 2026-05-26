"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { onlyDigits } from "@/lib/formatters";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const PRIMARY_ADMIN_EMAIL = "admin@saomarcos.com.br";
const MANUAL_REDEMPTION_REWARD_NAME = "Resgate manual";

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

type SupabaseErrorDetails = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
  name?: string;
  status?: number;
};

type RedemptionInsertPayload = Record<string, null | number | string>;

type RedemptionPayloadInput = {
  customerId: string;
  notes: string;
  pointsToRedeem: number;
  redemptionDate: string;
  rewardId?: null | string;
};

type CustomerPointsRow = {
  available_points?: null | number | string;
  customer_id: string;
  total_points?: null | number | string;
};

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getSupabaseErrorDetails(error: unknown): SupabaseErrorDetails | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const supabaseError = error as SupabaseErrorDetails;

  return {
    code: supabaseError.code,
    details: supabaseError.details,
    hint: supabaseError.hint,
    message: supabaseError.message,
    name: supabaseError.name,
    status: supabaseError.status,
  };
}

function logSupabaseError(context: string, error: unknown) {
  const details = getSupabaseErrorDetails(error);

  if (!details) {
    console.error(`[clientes] ${context}`, error);
    return;
  }

  console.error(`[clientes] ${context}`, {
    code: details.code,
    details: details.details,
    hint: details.hint,
    message: details.message,
    name: details.name,
    status: details.status,
  });
}

function isPrimaryAdminEmail(email?: null | string) {
  return email?.toLocaleLowerCase("pt-BR") === PRIMARY_ADMIN_EMAIL;
}

function getReadableCustomerSaveError(error: unknown) {
  const details = getSupabaseErrorDetails(error);

  if (!details) {
    return "Não foi possível salvar o cliente.";
  }

  const searchableError = [
    details.code,
    details.details,
    details.hint,
    details.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (details.code === "23505" || searchableError.includes("duplicate")) {
    return "Já existe um cliente com este documento.";
  }

  if (
    details.code === "42501" ||
    searchableError.includes("row-level security") ||
    searchableError.includes("permission denied")
  ) {
    return "Seu usuário está autenticado, mas não tem permissão de administrador para salvar clientes.";
  }

  if (
    details.code === "23502" &&
    (searchableError.includes("code") ||
      searchableError.includes("code_number"))
  ) {
    return "O código automático do cliente não foi gerado. Verifique se a migration de códigos foi aplicada no Supabase.";
  }

  if (
    details.code === "23503" &&
    searchableError.includes("level_id")
  ) {
    return "O nível selecionado não existe mais. Selecione outro nível ou deixe como Sem nível.";
  }

  if (
    details.code === "42P01" ||
    searchableError.includes("relation") ||
    searchableError.includes("does not exist")
  ) {
    return "A estrutura do banco de dados não está completa. Verifique se o schema foi aplicado no Supabase.";
  }

  if (
    details.code === "42703" ||
    details.code === "PGRST204" ||
    searchableError.includes("column")
  ) {
    return "O banco de dados está sem uma coluna esperada. Verifique se as migrations foram aplicadas.";
  }

  return details.message
    ? `Não foi possível salvar o cliente. Detalhe: ${details.message}`
    : "Não foi possível salvar o cliente.";
}

function isRedemptionSchemaFallbackError(error: unknown) {
  const details = getSupabaseErrorDetails(error);

  if (!details) {
    return false;
  }

  const searchableError = [
    details.code,
    details.details,
    details.hint,
    details.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    details.code === "42703" ||
    details.code === "PGRST204" ||
    searchableError.includes("points_used") ||
    searchableError.includes("points_spent") ||
    searchableError.includes("redemption_date") ||
    searchableError.includes("redeemed_at")
  );
}

function isRewardIdRequiredError(error: unknown) {
  const details = getSupabaseErrorDetails(error);

  if (!details) {
    return false;
  }

  const searchableError = [
    details.code,
    details.details,
    details.hint,
    details.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return details.code === "23502" && searchableError.includes("reward_id");
}

function getReadableRedemptionSaveError(error: unknown) {
  const details = getSupabaseErrorDetails(error);

  if (!details) {
    return "Não foi possível salvar o resgate.";
  }

  const searchableError = [
    details.code,
    details.details,
    details.hint,
    details.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    details.code === "42501" ||
    searchableError.includes("row-level security") ||
    searchableError.includes("permission denied")
  ) {
    return "Seu usuário está autenticado, mas não tem permissão de administrador para salvar resgates.";
  }

  if (details.code === "23502" && searchableError.includes("reward_id")) {
    return "O banco ainda exige um prêmio vinculado ao resgate. Aplique a migration de resgates manuais no Supabase.";
  }

  if (
    details.code === "23502" &&
    (searchableError.includes("points_used") ||
      searchableError.includes("redemption_date"))
  ) {
    return "O banco não aceitou os campos obrigatórios do resgate. Verifique a estrutura de reward_redemptions.";
  }

  if (
    details.code === "42P01" ||
    searchableError.includes("relation") ||
    searchableError.includes("does not exist")
  ) {
    return "A tabela ou view de resgates não está completa. Aplique a migration de resgates no Supabase.";
  }

  if (
    details.code === "42703" ||
    details.code === "PGRST204" ||
    searchableError.includes("column")
  ) {
    return "O banco de dados está sem uma coluna esperada para resgates. Aplique a migration de resgates no Supabase.";
  }

  if (details.code === "23503" && searchableError.includes("customer_id")) {
    return "O cliente selecionado não foi encontrado. Atualize a página e tente novamente.";
  }

  return details.message
    ? `Não foi possível salvar o resgate. Detalhe: ${details.message}`
    : "Não foi possível salvar o resgate.";
}

function getRedemptionPayloads({
  customerId,
  notes,
  pointsToRedeem,
  redemptionDate,
  rewardId = null,
}: RedemptionPayloadInput): Array<{
  label: string;
  payload: RedemptionInsertPayload;
}> {
  const cleanedNotes = notes || null;

  return [
    {
      label: "schema completo de resgates manuais",
      payload: {
        customer_id: customerId,
        notes: cleanedNotes,
        points_spent: pointsToRedeem,
        points_used: pointsToRedeem,
        redeemed_at: redemptionDate,
        redemption_date: redemptionDate,
        reward_id: rewardId,
        status: "completed",
      },
    },
    {
      label: "schema atual de resgates manuais",
      payload: {
        customer_id: customerId,
        notes: cleanedNotes,
        points_used: pointsToRedeem,
        redemption_date: redemptionDate,
        reward_id: rewardId,
        status: "completed",
      },
    },
    {
      label: "schema legado de resgates",
      payload: {
        customer_id: customerId,
        notes: cleanedNotes,
        points_spent: pointsToRedeem,
        redeemed_at: redemptionDate,
        reward_id: rewardId,
        status: "completed",
      },
    },
  ];
}

async function getManualRedemptionRewardId(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
) {
  const { data: existingReward, error: existingRewardError } =
    await supabaseAdmin
      .from("rewards")
      .select("id")
      .eq("name", MANUAL_REDEMPTION_REWARD_NAME)
      .limit(1)
      .maybeSingle();

  if (existingRewardError) {
    logSupabaseError(
      "Erro ao buscar prêmio interno de resgate manual.",
      existingRewardError,
    );
  }

  if (existingReward && "id" in existingReward) {
    return String(existingReward.id);
  }

  const { data: createdReward, error: createRewardError } = await supabaseAdmin
    .from("rewards")
    .insert({
      active: false,
      description: "Registro interno usado para resgates manuais de pontos.",
      name: MANUAL_REDEMPTION_REWARD_NAME,
      points_required: 0,
    })
    .select("id")
    .single();

  if (createRewardError) {
    logSupabaseError(
      "Erro ao criar prêmio interno de resgate manual.",
      createRewardError,
    );
    return null;
  }

  return createdReward && "id" in createdReward
    ? String(createdReward.id)
    : null;
}

async function saveRedemptionWithServiceRole(input: RedemptionPayloadInput) {
  let supabaseAdmin: ReturnType<typeof createAdminClient>;

  try {
    supabaseAdmin = createAdminClient();
  } catch (error) {
    logSupabaseError("Service role não configurada para resgate.", error);

    return {
      error,
      message:
        "A chave SUPABASE_SERVICE_ROLE_KEY não está configurada no servidor da Vercel.",
      success: false,
    };
  }

  let lastError: unknown = null;

  for (const fallback of getRedemptionPayloads(input)) {
    const { error } = await supabaseAdmin
      .from("reward_redemptions")
      .insert(fallback.payload);

    if (!error) {
      return { success: true };
    }

    lastError = error;
    logSupabaseError(
      `Erro ao salvar resgate com service role no ${fallback.label}.`,
      error,
    );
  }

  if (isRewardIdRequiredError(lastError)) {
    const manualRewardId = await getManualRedemptionRewardId(supabaseAdmin);

    if (manualRewardId) {
      for (const fallback of getRedemptionPayloads({
        ...input,
        rewardId: manualRewardId,
      })) {
        const { error } = await supabaseAdmin
          .from("reward_redemptions")
          .insert(fallback.payload);

        if (!error) {
          return { success: true };
        }

        lastError = error;
        logSupabaseError(
          `Erro ao salvar resgate com prêmio interno no ${fallback.label}.`,
          error,
        );
      }
    }
  }

  return {
    error: lastError,
    message: getReadableRedemptionSaveError(lastError),
    success: false,
  };
}

async function getCustomerPointsWithServiceRole(customerId: string) {
  let supabaseAdmin: ReturnType<typeof createAdminClient>;

  try {
    supabaseAdmin = createAdminClient();
  } catch (error) {
    logSupabaseError("Service role não configurada para validar saldo.", error);

    return {
      data: null,
      error,
      message:
        "A chave SUPABASE_SERVICE_ROLE_KEY não está configurada no servidor da Vercel.",
    };
  }

  const { data, error } = await supabaseAdmin
    .from("customer_points_view")
    .select("customer_id, available_points, total_points")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    logSupabaseError("Erro ao validar saldo com service role.", error);

    return {
      data: null,
      error,
      message: getReadableRedemptionSaveError(error),
    };
  }

  return {
    data: data as CustomerPointsRow | null,
    error: null,
    message: null,
  };
}

async function getAdminAccessError(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    logSupabaseError("Erro ao validar sessão do usuário.", userError);
    return "Não foi possível validar sua sessão. Entre novamente e tente cadastrar o cliente.";
  }

  if (!user) {
    return "Sua sessão expirou. Entre novamente para cadastrar clientes.";
  }

  if (isPrimaryAdminEmail(user.email)) {
    return null;
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

  if (adminError) {
    logSupabaseError("Erro ao validar perfil administrador.", adminError);
    return "Não foi possível validar a permissão de administrador. Verifique se o schema foi aplicado no Supabase.";
  }

  if (isAdmin !== true) {
    return "Seu usuário não tem perfil de administrador configurado no Supabase.";
  }

  return null;
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
  const adminAccessError = await getAdminAccessError(supabase);

  if (adminAccessError) {
    return {
      message: adminAccessError,
      values,
    };
  }

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
    logSupabaseError("Erro ao validar documento duplicado.", duplicateError);

    return {
      message: getReadableCustomerSaveError(duplicateError),
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
    logSupabaseError(
      values.id ? "Erro ao atualizar cliente." : "Erro ao cadastrar cliente.",
      response.error,
    );

    return {
      message: getReadableCustomerSaveError(response.error),
      fieldErrors:
        response.error.code === "23505"
          ? {
              document: "Documento já cadastrado.",
            }
          : undefined,
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
  const adminAccessError = await getAdminAccessError(supabase);

  if (adminAccessError) {
    return {
      message: adminAccessError,
      values,
    };
  }

  const { data: customerPoints, error: pointsError } = await supabase
    .from("customer_points_view")
    .select("customer_id, available_points, total_points")
    .eq("customer_id", values.customerId)
    .maybeSingle();
  let resolvedCustomerPoints = customerPoints as CustomerPointsRow | null;

  if (pointsError) {
    logSupabaseError("Erro ao validar saldo para resgate.", pointsError);
    const servicePointsResult = await getCustomerPointsWithServiceRole(
      values.customerId,
    );

    if (servicePointsResult.error || !servicePointsResult.data) {
      return {
        message:
          servicePointsResult.message ??
          getReadableRedemptionSaveError(pointsError),
        values,
      };
    }

    resolvedCustomerPoints = servicePointsResult.data;
  }

  if (!resolvedCustomerPoints) {
    return {
      message:
        "Não foi possível encontrar o saldo do cliente. Atualize a página e tente novamente.",
      values,
    };
  }

  const availablePoints = Math.max(
    Number(
      resolvedCustomerPoints.available_points ??
        resolvedCustomerPoints.total_points ??
        0,
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

  const redemptionInput = {
    customerId: values.customerId,
    notes: values.notes,
    pointsToRedeem,
    redemptionDate,
  };
  const { error } = await supabase
    .from("reward_redemptions")
    .insert(getRedemptionPayloads(redemptionInput)[0].payload);

  if (error && isRedemptionSchemaFallbackError(error)) {
    logSupabaseError(
      "Erro ao salvar resgate no schema completo; tentando fallbacks.",
      error,
    );

    let fallbackError: unknown = error;

    for (const fallback of getRedemptionPayloads(redemptionInput).slice(1)) {
      const { error: currentFallbackError } = await supabase
        .from("reward_redemptions")
        .insert(fallback.payload);

      if (!currentFallbackError) {
        revalidatePath("/admin/clientes");
        revalidatePath("/admin/dashboard");
        revalidatePath("/admin/ranking");
        redirect(getRedirectUrl("redeemed"));
      }

      fallbackError = currentFallbackError;
      logSupabaseError(
        `Erro ao salvar resgate no ${fallback.label}.`,
        currentFallbackError,
      );
    }

    const serviceResult = await saveRedemptionWithServiceRole(redemptionInput);

    if (serviceResult.success) {
      revalidatePath("/admin/clientes");
      revalidatePath("/admin/dashboard");
      revalidatePath("/admin/ranking");
      redirect(getRedirectUrl("redeemed"));
    }

    return {
      message:
        serviceResult.message ?? getReadableRedemptionSaveError(fallbackError),
      values,
    };
  }

  if (error) {
    logSupabaseError("Erro ao salvar resgate.", error);

    const serviceResult = await saveRedemptionWithServiceRole(redemptionInput);

    if (serviceResult.success) {
      revalidatePath("/admin/clientes");
      revalidatePath("/admin/dashboard");
      revalidatePath("/admin/ranking");
      redirect(getRedirectUrl("redeemed"));
    }

    return {
      message: serviceResult.message ?? getReadableRedemptionSaveError(error),
      values,
    };
  }

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/ranking");
  redirect(getRedirectUrl("redeemed"));
}
