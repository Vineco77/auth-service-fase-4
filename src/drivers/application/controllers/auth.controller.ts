import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateJwtUseCase } from '../../../core/application/use-cases/create-jwt.use-cases';
import { CreateJwtDto } from '../dtos/create-jwt.dto';
import { JwtResponseDto } from '../dtos/jwt-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly createJwtUseCase: CreateJwtUseCase) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create JWT token' })
  @ApiBody({ type: CreateJwtDto })
  @ApiResponse({
    status: 200,
    description: 'Token created successfully',
    type: JwtResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid CPF format',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createToken(@Body() createJwtDto: CreateJwtDto): Promise<JwtResponseDto> {
    const { token } = await this.createJwtUseCase.execute(
      createJwtDto.cpf,
      createJwtDto.name,
    );

    return {
      success: true,
      token,
      message: 'Token created successfully',
    };
  }
}