import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.useBodyParser('json', { limit: '32mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '32mb' });

  app.setGlobalPrefix('api/v1');
  app.use(helmet());

  const origins = (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:5001')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(config.get('PORT') ?? 5050);
  const host = config.get<string>('HOST') ?? '0.0.0.0';
  await app.listen(port, host);
  // eslint-disable-next-line no-console
  console.log(`CRMAnHung API listening on http://${host}:${port}/api/v1`);
}

bootstrap();
