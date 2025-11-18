import { IsString, IsOptional, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJwtDto {
  @ApiProperty({
    description: 'CPF do usuário (apenas números, 11 caracteres)',
    example: '12345678901',
  })
  @IsString()
  @Length(11, 11, { message: 'CPF must have exactly 11 characters' })
  @Matches(/^\d+$/, { message: 'CPF must contain only numbers' })
  cpf: string;

  @ApiProperty({
    description: 'Nome do usuário (opcional)',
    example: 'João Silva',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
}