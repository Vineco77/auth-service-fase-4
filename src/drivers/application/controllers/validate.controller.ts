import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ValidateJwtUseCase } from '../../../core/application/use-cases/validate-jwt.use-case';
import { ValidateJwtDto } from '../dtos/validate-jwt.dto';
import { JwtPayload } from '../../../../libs/auth-lib/src/interfaces/jwt-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class ValidateController {
  constructor(private readonly validateJwtUseCase: ValidateJwtUseCase) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiBody({ type: ValidateJwtDto })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    schema: {
      example: {
        success: true,
        valid: true,
        payload: {
          sub: '12345678901',
          cpf: '12345678901',
          user_type: 'cliente',
          name: 'João Silva',
          iat: 1633046400,
          exp: 1633047300
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Token expired or invalid',
  })
  async validateToken(@Body() validateJwtDto: ValidateJwtDto): Promise<{
    success: boolean;
    valid: boolean;
    payload?: JwtPayload;
  }> {
    try {
      const payload = await this.validateJwtUseCase.execute(validateJwtDto.token);
      
      return {
        success: true,
        valid: true,
        payload,
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
      };
    }
  }
}