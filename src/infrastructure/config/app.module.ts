// src/infrastructure/config/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from '../../drivers/application/controllers/auth.controller';
import { ValidateController } from '../../drivers/application/controllers/validate.controller';
import { EmployeesController } from '../../drivers/application/controllers/employees.controller';
import { CreateJwtUseCase } from '../../core/application/use-cases/create-jwt.use-cases';
import { ValidateJwtUseCase } from '../../core/application/use-cases/validate-jwt.use-case';
import { CreateEmployeeUseCase } from '../../core/application/use-cases/create-employee.use-case';
import { DeleteEmployeeUseCase } from '../../core/application/use-cases/delete-employee.use-case';
import { PrismaService } from './database/prisma/prisma.service';
import { UserRepository } from '../../infrastructure/adapters/persistence/repositories/user.repository';
import { JwtService } from '../../infrastructure/adapters/services/jwt.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [
    AuthController,
    ValidateController,
    EmployeesController,
  ],
  providers: [
    // Use Cases
    CreateJwtUseCase,
    ValidateJwtUseCase,
    CreateEmployeeUseCase,
    DeleteEmployeeUseCase,
    
    // Services
    PrismaService,
    JwtService,
    
    // Repositories
    {
      provide: 'UserRepositoryInterface',
      useClass: UserRepository,
    },
    {
      provide: 'JwtServiceInterface', 
      useClass: JwtService,
    },
  ],
})
export class AppModule {}