import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/passport/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const reflector = app.get(Reflector);

  //config response data
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  //config class validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  //config auth route with jwt 
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  await app.listen(configService.get<string>("PORT") ?? 3000);
}
bootstrap();