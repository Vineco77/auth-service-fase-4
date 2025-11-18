import { Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../../../core/application/ports/output/repositories/user.repository.interface';
import { UserEntity } from '../../../../core/domain/entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { PrismaService } from '../../../../infrastructure/config/database/prisma/prisma.service';

@Injectable()
export class UserRepository implements UserRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserEntity): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: UserMapper.toPersistence(user),
    });
    return UserMapper.toDomain(created);
  }

  async findByCpf(cpf: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { cpf },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async deleteByCpf(cpf: string): Promise<void> {
    await this.prisma.user.delete({
      where: { cpf },
    });
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany();
    return users.map(UserMapper.toDomain);
  }
}