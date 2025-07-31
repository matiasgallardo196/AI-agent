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

export const INTENT_DESCRIPTIONS: { name: IntentName; description: string }[] = [
  {
    name: IntentName.GetProducts,
    description: 'Shows a list of products. Can search by name or description.',
  },
  {
    name: IntentName.GetProduct,
    description: 'Returns details of a specific product (by name or ID).',
  },
  {
    name: IntentName.CreateCart,
    description: 'Creates a new cart with the specified products.',
  },
  {
    name: IntentName.UpdateCart,
    description: 'Modifies an existing cart: changes quantities or adds/removes products.',
  },
];
