export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatDocument(document: string, type: "cpf" | "cnpj") {
  const digits = onlyDigits(document);

  if (type === "cpf" && digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  if (type === "cnpj" && digits.length === 14) {
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  }

  return document;
}

export function formatPhone(phone: string) {
  const digits = onlyDigits(phone);

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return phone;
}

export function parseCurrencyToCents(value: string) {
  const cleaned = value.replace(/[^\d,.]/g, "").trim();

  if (!cleaned) {
    return null;
  }

  let normalized = cleaned;

  if (cleaned.includes(",")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    const lastPart = parts.at(-1) ?? "";

    normalized =
      parts.length > 1 && lastPart.length === 3
        ? parts.join("")
        : cleaned.replace(/(?<=\d)\.(?=\d{3}\b)/g, "");
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
}

export function formatCurrencyFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}

export function calculatePointsFromCents(cents: number) {
  return cents / 1000;
}

export function formatPoints(points: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(points);
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function toDateTimeLocalValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function parseNumber(value: string) {
  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
