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
