export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends never ? never : DeepPartial<T[P]>;
};
