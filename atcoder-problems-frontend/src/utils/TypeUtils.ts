const hasProperty = <X extends unknown, Y extends PropertyKey>(
  obj: X | null | undefined,
  prop: Y
): obj is X & Record<Y, unknown> => {
  return Object.prototype.hasOwnProperty.call(obj, prop) ?? false;
};
export const isString = (obj: unknown): obj is string =>
  typeof obj === "string";
export const isNumber = (obj: unknown): obj is number =>
  typeof obj === "number";
export const isBoolean = (obj: unknown): obj is boolean =>
  typeof obj === "boolean";
export const hasPropertyAsType = <X extends unknown, Y extends PropertyKey, T>(
  obj: X | null | undefined,
  prop: Y,
  check: { (arg: unknown): arg is T }
): obj is X & Record<Y, T> => {
  return hasProperty(obj, prop) && check(obj[prop]);
};
export const hasPropertyAsTypeOrNull = <
  X extends unknown,
  Y extends PropertyKey,
  T
>(
  obj: X | null | undefined,
  prop: Y,
  check: { (arg: unknown): arg is T }
): obj is X & Record<Y, T | null> => {
  return hasProperty(obj, prop) && (check(obj[prop]) || obj[prop] === null);
};
export const hasPropertyAsTypeOrUndefined = <
  X extends unknown,
  Y extends PropertyKey,
  T
>(
  obj: X | null | undefined,
  prop: Y,
  check: { (arg: unknown): arg is T }
): obj is X & Record<Y, T | undefined> => {
  return (
    !hasProperty(obj, prop) ||
    check(obj[prop]) ||
    typeof obj[prop] === "undefined"
  );
};
