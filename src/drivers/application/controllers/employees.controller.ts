import { 
  Body, Controller, Post, HttpCode, HttpStatus, Delete, Param, Headers 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiHeader } from '@nestjs/swagger';
import { CreateEmployeeDto } from '../dtos/create-employee.dto';
import { EmployeeResponseDto } from '../dtos/employee-response.dto';
import { CreateEmployeeUseCase } from '../../../core/application/use-cases/create-employee.use-case';
import { DeleteEmployeeUseCase } from '../../../core/application/use-cases/delete-employee.use-case';

@ApiTags('employees')
@Controller('auth/employees')
export class EmployeesController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly deleteEmployeeUseCase: DeleteEmployeeUseCase
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiHeader({
    name: 'x-admin-secret',
    description: 'Admin secret key',
    required: true,
  })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Invalid admin secret key',
  })
  @ApiResponse({
    status: 409,
    description: 'Employee with this CPF already exists',
  })
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Headers('x-admin-secret') secretKey: string,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.createEmployeeUseCase.execute(
      createEmployeeDto.cpf,
      createEmployeeDto.name,
      secretKey,
    );

    return {
      success: true,
      id: employee.id!,
      message: 'Employee registered successfully',
      cpf: employee.cpf,
      name: employee.name,
    };
  }

  @Delete(':cpf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an employee by CPF' })
  @ApiHeader({
    name: 'x-admin-secret',
    description: 'Admin secret key',
    required: true,
  })
  @ApiParam({
    name: 'cpf',
    description: 'CPF of the employee to delete',
    example: '12345678901',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Invalid admin secret key',
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  async deleteEmployee(
    @Param('cpf') cpf: string,
    @Headers('x-admin-secret') secretKey: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.deleteEmployeeUseCase.execute(cpf, secretKey);

    return {
      success: true,
      message: 'Employee deleted successfully',
    };
  }
}