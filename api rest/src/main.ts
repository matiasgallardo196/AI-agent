import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './config/env.loader';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
  });
  await app.listen(PORT ?? 3001);
}
bootstrap();
