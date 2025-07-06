export function objectToFormData(obj: Record<string, any>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      formData.append(key, "");
      continue;
    }
    formData.append(key, value);
  }
  return formData;
}
