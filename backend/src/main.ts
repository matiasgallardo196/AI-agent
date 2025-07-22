import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './config/env.loader';
import { ResponseTimeInterceptor } from './interceptors/response-time.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ResponseTimeInterceptor());

  app.enableCors({
    origin: '*',
  });
  await app.listen(PORT ?? 3001);
}
bootstrap();
