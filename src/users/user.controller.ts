import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { EditCandidateDto } from './dtos/editCandidate.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Get('candidates')
  // async getAllUsers() {
  //   return await this.userService.getAllUsers();
  // }

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

  @UseGuards(JwtAuthGuard)
  @Get('candidates/:id')
  async getCandidateById(@Param('id') id: string) {
    const user = await this.userService.getCandidateById(+id);
    console.log(user);
    return user;
  }

  // @Post('candidates')
  // async createCandidate(@Body() createCandidateDto: CreateUserDto) {
  //   return await this.userService.createCandidate(createCandidateDto);
  // }

  @UseGuards(JwtAuthGuard)
  @Patch('candidates/:id')
  async editCandidate(
    @Param('id') id: string,
    @Body() editCandidateDto: EditCandidateDto,
  ) {
    console.log(
      `user id is ${id} and dto is ${JSON.stringify(editCandidateDto)}`,
    );
    return await this.userService.updateCandidate(+id, editCandidateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('candidates/:id')
  async deleteCandidate(@Param('id') id: string) {
    return await this.userService.deleteCandidate(+id);
  }
}
