import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './infrastructure/config/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('Microserviço de Autenticação')
    .setVersion('1.0')
    .addTag('auth')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 1337;
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen(port, host);
  console.log(`🚀 Auth Service running on: http://${host}:${port}`);
}

bootstrap();