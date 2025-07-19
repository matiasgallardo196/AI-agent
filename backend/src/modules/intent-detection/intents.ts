export enum IntentName {
  GetProducts = 'get_products',
  GetProduct = 'get_product',
  CreateCart = 'create_cart',
  UpdateCart = 'update_cart',
  Fallback = 'fallback',
}

export const VALID_INTENTS = [
  IntentName.GetProducts,
  IntentName.GetProduct,
  IntentName.CreateCart,
  IntentName.UpdateCart,
];
