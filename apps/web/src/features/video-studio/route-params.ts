/** Next dynamic segment — string hoặc mảng (hiếm). */
export function routeParamId(value: string | string[] | undefined): string {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return '';
}
