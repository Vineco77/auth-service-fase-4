import { UserEntity } from '../../../../domain/entities/user.entity';

export interface UserRepositoryInterface {
  create(user: UserEntity): Promise<UserEntity>;
  findByCpf(cpf: string): Promise<UserEntity | null>;
  deleteByCpf(cpf: string): Promise<void>;
  findAll(): Promise<UserEntity[]>;
}