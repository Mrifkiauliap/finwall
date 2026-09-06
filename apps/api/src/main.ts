import getConfig from '@finwall/config/api';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { TransformInterceptor } from './core/interceptors/transform.interceptor.js';

const config = getConfig();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security HTTP Headers
  app.use(helmet());

  // Cookie parsing for JWT cookie extractors
  app.use(cookieParser());

  // CORS Configuration
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global Transform Interceptor for standard HTTP response format
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(config.APP_PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${config.APP_PORT ?? 3000}`,
  );
}

await bootstrap();
