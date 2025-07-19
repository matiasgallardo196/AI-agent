import { Injectable } from '@nestjs/common';
import { IntentDetectionService } from '../intent-detection/intent-detection.service';
import { ProductsService } from '../products/products.service';
import { CartsService } from '../carts/carts.service';
import { OpenAiService } from '../openai/openai.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly intentDetectionService: IntentDetectionService,
    private readonly productsService: ProductsService,
    private readonly cartsService: CartsService,
    private readonly openaiService: OpenAiService,
  ) {}
  async processUserMessage(text: string) {
    // 1. Detectar intención
    const intent = await this.intentDetectionService.detectIntent(text);

    console.log('Detected intent:', intent);

    //2. Según la intención, decidir si es relevante
    switch (intent.name) {
      case 'get_products':
        const products = await this.productsService.getAllProducts();
        return this.openaiService.rephraseForUser({
          data: products,
          intention: intent.name,
        });

      // case 'get_product_by_id':
      //   const product = await this.productsService.getProductById(intent.productId);
      //   return this.openaiService.rephraseForUser({
      //   data: product,
      //   intention: intent.name,
      // });

      // case 'create_cart':
      //   const items = this.intentDetectionService.extractCartItems(text);
      //   const result = await this.cartsService.createCart(items);
      //   return this.openaiService.rephraseForUser({
      //     data: result,
      //     intention: intent.name,
      //   });

      // case 'update_cart':
      //   const updateItems = this.intentDetectionService.extractCartItems(text);
      //   const updated = await this.cartsService.updateCartItems(
      //     cartId,
      //     updateItems,
      //   );
      //   return this.openaiService.rephraseForUser({
      //     data: updated,
      //     intention: intent.name,
      //   });

      default:
        console.log('No relevant intent detected, using fallback.');
        // 3. Si no hay intención clara o no es relevante
        return this.openaiService.rephraseForUser({
          data: null,
          intention: 'fallback',
          userMessage: text,
        });
    }
  }
}
