export const USERS_PATTERNS = {
  SIGNUP: "auth.register",
  LOGIN: "auth.login",
  GET: "user.getUser",
  UPDATE: "user.updateUser",
  DELETE: "user.deleteUser",
} as const;

export const PRODUCT_PATTERNS = {
  CREATE: "product.create",
  FIND_ALL: "product.findAll",
  FIND_ONE: "product.findOne",
  UPDATE: "product.update",
  DELETE: "product.delete",
  SEARCH: "product.search",
  UPDATE_STOCK: "product.updateStock",
} as const;
