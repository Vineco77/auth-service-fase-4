import { ApiProperty } from '@nestjs/swagger';

export class DeleteEmployeeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Employee deleted successfully' })
  message: string;
}