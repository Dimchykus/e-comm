export const USERS_PATTERNS = {
  SIGNUP: "auth.register",
  LOGIN: "auth.login",
  GET: "user.getUser",
  UPDATE: "user.updateUser",
  DELETE: "user.deleteUser",
} as const;

export const PRODUCTS_PATTERNS = {
  CREATE: "product.create",
  FIND_BY_ID: "product.findById",
  UPDATE: "product.update",
  DELETE: "product.delete",
  SEARCH: "product.search",
  UPDATE_STOCK: "product.updateStock",
} as const;

export const SHOPPING_CART_PATTERNS = {
  CREATE: "cart.create",
  ADD_PRODUCT: "cart.addProduct",
  REMOVE_PRODUCT: "cart.removeProduct",
  SET_PRODUCT_QUANTITY: "cart.setProductQuantity",
} as const;

export const ORDERS_PATTERNS = {
  CREATE: "order.create",
  FIND_BY_ID: "order.findById",
  FIND_BY_USER: "order.findByUser",
  UPDATE_STATUS: "order.updateStatus",
} as const;

export const PAYMENTS_PATTERNS = {
  CHARGE: "payment.charge",
  REFUND: "payment.refund",
  GET_HISTORY: "payment.getHistory",
} as const;
