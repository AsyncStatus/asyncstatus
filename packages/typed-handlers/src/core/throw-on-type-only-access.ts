export const throwOnTypeOnlyAccess = new Proxy(
  {},
  {
    get() {
      throw new Error(
        `You're trying to access a type-only property in value context on a typed contract. This is not allowed.`,
      );
    },
    set() {
      throw new Error(
        `You're trying to set a type-only property in value context on a typed contract. This is not allowed.`,
      );
    },
    deleteProperty() {
      throw new Error(
        `You're trying to delete a type-only property in value context on a typed contract. This is not allowed.`,
      );
    },
    defineProperty() {
      throw new Error(
        `You're trying to define a type-only property in value context on a typed contract. This is not allowed.`,
      );
    },
    has() {
      throw new Error(
        `You're trying to check if a type-only property exists in value context on a typed contract. This is not allowed.`,
      );
    },
    getOwnPropertyDescriptor() {
      return {
        value: undefined,
        writable: false,
        enumerable: false,
        configurable: false,
      };
    },
  },
);
