import type { UnionToIntersection } from "../@types/UnionToIntersection";

function isObject(val: unknown): val is { [key: string]: any; } {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

export function deepMerge<T extends { [key: string]: any; }[]>(
  ...objects: T): UnionToIntersection<T[number]> {
  return objects
    .reduce((result, current) => {
      for (const key of Object.keys(current)) {
        // Only consider deep merging objects. Check if the value is an object.
        if(isObject(current[key])) {
          // CHeck if this object is present on the result object. If not, we can merging.
          if(key in result) {
            // Merge the objects and piggy-back the final return statement for doing the actual merge.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
            current[key] = deepMerge(result[key], current[key]);
          }
        }
      }
      return Object.assign({}, result, current);
    }, {}) as UnionToIntersection<T[number]>;
}
