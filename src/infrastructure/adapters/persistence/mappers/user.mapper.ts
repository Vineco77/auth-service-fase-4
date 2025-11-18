import { UserEntity } from '../../../../core/domain/entities/user.entity';

export class UserMapper {
  static toDomain(raw: any): UserEntity {
    return new UserEntity(
      raw.id,
      raw.cpf,
      raw.name
    );
  }

  static toPersistence(user: UserEntity): any {
    return {
      cpf: user.cpf,
      name: user.name,
      ...(user.id && { id: user.id }),
    };
  }
}