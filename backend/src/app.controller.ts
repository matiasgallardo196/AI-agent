import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  @Get()
  getRoot(): string {
    return 'API REST corriendo';
  }
}
