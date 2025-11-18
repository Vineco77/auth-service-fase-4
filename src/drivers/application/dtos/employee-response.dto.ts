import { ApiProperty } from '@nestjs/swagger';

export class EmployeeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Employee registered successfully' })
  message: string;

  @ApiProperty({ example: '12345678901' })
  cpf: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;
}