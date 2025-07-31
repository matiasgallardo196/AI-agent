export class PromptBuilder {
  static buildPrompt({
    data,
    intention,
    userMessage,
  }: {
    data: any;
    intention: string;
    userMessage?: string;
  }): string {
    const cleaned = JSON.parse(
      JSON.stringify(data, (key, value) =>
        key === 'embedding' || key === 'score' ? undefined : value,
      ),
    );

    const summary = Array.isArray(cleaned)
      ? cleaned
          .map((p, i) => `${i + 1}. ${p.name} - $${p.price} - ${p.description}`)
          .slice(0, 10)
          .join('\n')
      : JSON.stringify(cleaned, null, 2);

    switch (intention) {
      case 'get_products':
        return `You are a friendly sales agent. The user asked to see products. Rephrase this information clearly and attractively:\n\n${summary}`;

      case 'create_cart':
        if ('errors' in cleaned && Array.isArray(cleaned.errors)) {
          const errors = cleaned.errors
            .map((err, i) => {
              return `${i + 1}. ${err.name}: you requested ${err.requestedQuantity}, but only ${err.stockAvailable} are available.`;
            })
            .join('\n');

          return `
      You are a sales agent named Christian. You are helping the user within a chat shopping system.

      The cart could not be created because there are products with insufficient stock:

      ${errors}

      Would you like to adjust the quantities to continue with cart creation?

      You can respond "yes" to use the maximum available quantity or manually indicate the new quantities.

      I'm here to help you 😊
    `.trim();
        }

        if (!Array.isArray(cleaned.items)) {
          return `The cart could not be created because no valid products were found.`;
        }

        const productLines = cleaned.items
          .map((item, i) => {
            const name = item.product?.name || `Unknown product (ID: ${item.productId})`;
            const price = item.product?.price != null ? item.product.price : null;
            const desc = item.product?.description || '';
            const priceFormatted = price != null ? `$${price.toLocaleString()}` : '';
            return `${i + 1}. ${name} x${item.qty}${priceFormatted ? ` - ${priceFormatted}` : ''}${desc ? ` - ${desc}` : ''}`;
          })
          .join('\n');

        const total = cleaned.items.reduce((acc, item) => {
          const unit = item.product?.price;
          return unit != null ? acc + unit * item.qty : acc;
        }, 0);

        const totalLine =
          total > 0 ? `\n\nEstimated purchase total: $${total.toLocaleString()}` : '';

        return `
    You are a friendly sales agent named Christian. You are helping the user within a chat shopping system.

    The user just created a cart with the following products:

    ${productLines}${totalLine}

    The generated cart number is: ${cleaned.id}.

    Confirm the cart creation in a friendly way, including the names, quantities and estimated total.
    Clarify that if they want to modify their cart later, they can do so by indicating the ID number ${cleaned.id}.
    Avoid technical language and speak like a human advisor, maintaining Christian's warm and helpful tone.
  `.trim();

      case 'update_cart':
        if (userMessage === 'no_cart_found') {
          return `
            I couldn't find an active cart to modify.
            Could you tell me the cart number you want to edit?
            For example: "the 3" or "I want to modify cart 5".
            `.trim();
        }

        if (userMessage === 'no_items_detected') {
          return `
           I couldn't identify what products you want to modify in your cart.
            Could you tell me what items you want to change and in what quantities?
            For example: "3 black shirts size M" or "I want to add 2 sports pants".
            `.trim();
        }

        return `The user modified their cart. The products are now:\n\n${summary}\nConfirm the changes clearly.`;

      case 'fallback':
      default:
        return `You are a friendly sales agent named Christian. You are within a system that only allows you to help with:

                    1. View available products.
                    2. Check product details.
                    3. Create a shopping cart.
                    4. Modify an existing cart.

                    The user wrote: "${userMessage}"

                    You cannot help with payments, shipping, personal data, or make real purchases.

                    Formulate a friendly and clear question to redirect the user towards one of the functions you can perform. If the message is very confusing, try to guide them with examples like: "Would you like me to show you the available products?" or "Are you looking for something specific?".
                      `.trim();
    }
  }
}
