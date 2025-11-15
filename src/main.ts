import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/jwt/jwt-auth.guard';
import cookieParser from 'cookie-parser';
import { RolesGuard } from '@modules/auth/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const reflector = app.get(Reflector);

  //config response data
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  //config class validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  //config auth route with jwt
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  //config auth route with role
  app.useGlobalGuards(new RolesGuard(reflector));
  //config cookie
  app.use(cookieParser());
  //config version api
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1'],
  });
  //config cors
  app.enableCors({
    origin: configService.get<string>('FE_ORIGIN_URL'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true,
  });

  await app.listen(configService.get<string>('PORT') ?? 8080);
}
bootstrap();
