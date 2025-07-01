// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function getEntityKey(entity: Function | { name: string }): string {
  if (entity === null || entity === undefined) {
    throw new Error("entity is not defined, check circular dependency issue");
  }
  return entity.name || entity.constructor.name;
}
