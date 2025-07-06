export function serializeFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === null) {
      formData.append(key, "null");
      continue;
    }

    if (value === undefined) {
      formData.append(key, "undefined");
      continue;
    }

    formData.append(key, value as any);
  }

  return formData;
}

export function deserializeFormData(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value === "null") {
      data[key] = null;
      continue;
    }

    if (value === "undefined") {
      data[key] = undefined;
      continue;
    }

    data[key] = value;
  }
  return data;
}

export function deserializeFormDataObject(data: Record<string, unknown>): Record<string, unknown> {
  for (const [key, value] of Object.entries(data)) {
    if (value === "null") {
      data[key] = null;
      continue;
    }

    if (value === "undefined") {
      data[key] = undefined;
      continue;
    }

    data[key] = value;
  }
  return data;
}
