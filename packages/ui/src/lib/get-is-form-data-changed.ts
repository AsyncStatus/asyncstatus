export function getIsFormDataChanged(data: any, defaultValues: any) {
  return Object.keys(data).some((key) => data[key] !== defaultValues[key]);
}
