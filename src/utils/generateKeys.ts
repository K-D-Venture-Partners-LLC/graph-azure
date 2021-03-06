export function generateEntityKey(
  id: string | string[] | number | undefined,
): string {
  if (!id) {
    throw new Error('Cannot generate entity key with `undefined` id');
  }
  if (Array.isArray(id)) {
    throw new Error('Cannot generate entity key with array id');
  }
  return `${id}`;
}

export function generateRelationshipKey(
  fromKey: string,
  toKey: string,
): string {
  return `${fromKey}_${toKey}`;
}
