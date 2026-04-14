import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('test')
  @ApiOperation({ summary: 'Логин + JWT' })
  @ApiBody({
    schema: {
      example: {
        email: 'string@mail.ru',
        password: 'string123'
      }
    }
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

}