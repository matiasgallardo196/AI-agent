import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  app.use((req, res, next) => {
    console.log('Before route match:', req.method, req.url);

    // if (req.method === 'POST' && req.url === '/message') {
    //   // Cambia la URL y el método antes del enrutamiento
    //   // ia busca a q direcion y q metodo aplicar
    //   req.url = '/direccion';
    //   req.method = 'metodo';
    //   console.log(`Redirigiendo a ${req.method} ${req.url}`);
    // }

    next();
  });

  await app.listen(port);
  console.log(`🚀 App listening on port ${port}`);
}
bootstrap();
