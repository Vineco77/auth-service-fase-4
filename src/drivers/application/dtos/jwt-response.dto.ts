import { ApiProperty } from '@nestjs/swagger';

export class JwtResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;

  @ApiProperty({ example: 'Token created successfully' })
  message: string;
}