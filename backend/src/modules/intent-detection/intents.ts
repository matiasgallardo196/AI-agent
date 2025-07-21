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
    description: 'Muestra una lista de productos. Se puede buscar por nombre o descripción.',
  },
  {
    name: IntentName.GetProduct,
    description: 'Devuelve el detalle de un producto específico (por nombre o ID).',
  },
  {
    name: IntentName.CreateCart,
    description: 'Crea un nuevo carrito con los productos indicados.',
  },
  {
    name: IntentName.UpdateCart,
    description: 'Modifica un carrito existente: cambia cantidades o agrega/saca productos.',
  },
];
