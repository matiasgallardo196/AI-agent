import { Controller, Post, Body } from '@nestjs/common';

@Controller('message')
export class MessageController {
  @Post()
  handleMessage(@Body() body: { message: string }) {
    console.log('Mensaje recibido:', body);
    // Acá llamás a OpenAI y a tus endpoints internos
    return `Mensaje recibido: ${body.message}`;
  }
}
