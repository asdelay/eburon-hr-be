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
    @Query('sort') sort?: 'confidence_asc' | 'confidence_desc',
    @Query('filter')
    filter?:
      | 'all'
      | 'lt3months'
      | '3to12months'
      | '1to2years'
      | '2to5years'
      | 'gt5years',
  ) {
    const result = await this.userService.getCandidatesForEmployer(
      role,
      sort,
      filter,
    );
    console.log(result);
    return result;
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
