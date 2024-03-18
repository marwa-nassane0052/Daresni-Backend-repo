import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UserDTO } from './DTO/User.dto';
import { AuthService } from './auth.service';
import { LoginDTO } from './DTO/login.dto';
import { ProfDTO } from './DTO/Prof.dto';
import { StudentDTO } from './DTO/Student.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
//signUp prof
  @Post('signup/prof')
  async signupProf(
    @Body() createUserDto: UserDTO,
    @Body() profileDto: ProfDTO,
  ) {
    return await this.authService.signupProf(createUserDto, profileDto);
  }
//signup Student
  @Post('signup/student')
  async signupStudent(
    @Body() createUserDto: UserDTO,
    @Body() profileDto: StudentDTO,
  ) {
    return await this.authService.signupStudent(createUserDto, profileDto);
  }
  //login user
  @Post('login')
  async login(@Body() loginDto: LoginDTO) {
    const { email, password } = loginDto;
    const token = await this.authService.login(email, password);
    return { token };
  }
// get the user by token
  @Get('user')
  async getUser(@Req() request: Request) {
    const token = request.headers.authorization;
    return this.authService.decodeToken(token);
  }
  // very role of the user
  @Get('user/:role')
  async getUserWithRole(@Req() request: Request) {
    const token = request.headers.authorization;
    const role = request.params.role;
    const decoded = this.authService.decodeToken(token);
    const verified = await this.authService.verifyUserRole(decoded.id, role);
    if (verified) {
      return decoded;
    } else {
      throw new ForbiddenException('forbidden');
    }
  }
  // verify account by sending an email
  @Post('verify')
  async verifyUser(@Req() request: Request) {
    const token = request.headers.authorization;
    return this.authService.verifyUser(token);
  }
  
}