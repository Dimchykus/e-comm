export const USER_PATTERNS = {
  REGISTER: 'user.register',
  LOGIN: 'user.login',
  GET_PROFILE: 'user.getProfile',
  UPDATE_PROFILE: 'user.updateProfile',
  DELETE_ACCOUNT: 'user.deleteAccount',
} as const;

export const PRODUCT_PATTERNS = {
  CREATE: 'product.create',
  FIND_ALL: 'product.findAll',
  FIND_ONE: 'product.findOne',
  UPDATE: 'product.update',
  DELETE: 'product.delete',
  SEARCH: 'product.search',
  UPDATE_STOCK: 'product.updateStock',
} as const;
