import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/createUser.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('candidates')
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  @Get('candidates/for-employer')
  async getCandidatesForEmployer(
    @Query('role') role?: string,
    @Query('sort') sort?: string,
  ) {
    return await this.userService.getCandidatesForEmployer(role, sort);
  }

  @Get('candidates/:id')
  async getCandidateById(@Param('id') id: string) {
    return await this.userService.getCandidateById(+id);
  }

  @Post('candidates')
  async createCandidate(@Body() createCandidateDto: CreateUserDto) {
    return await this.userService.createCandidate(createCandidateDto);
  }
}
