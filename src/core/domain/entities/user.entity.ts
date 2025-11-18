export class UserEntity {
  constructor(
    public readonly id: number | null,
    public readonly cpf: string,
    public readonly name: string,
  ) {}

  static create(props: {
    cpf: string;
    name: string;
  }): UserEntity {
    return new UserEntity(null, props.cpf, props.name);
  }
}