import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'CPF of the employee (11 digits, numbers only)',
    example: '12345678901',
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  cpf: string;

  @ApiProperty({
    description: 'Full name of the employee',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;
}