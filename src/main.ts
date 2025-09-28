import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const reflector = app.get(Reflector);

  //config response data
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  await app.listen(configService.get<string>("PORT") ?? 3000);
}
bootstrap();