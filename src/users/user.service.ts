import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dtos/createUser.dto';
import { Prisma } from 'src/generated/prisma/client';
import { EditCandidateDto } from './dtos/editCandidate.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany();
      return users;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getCandidatesForEmployer(
    roleSearch?: string,
    sort?: 'confidence_asc' | 'confidence_desc',
    filter?:
      | 'all'
      | 'lt3months'
      | '3to12months'
      | '1to2years'
      | '2to5years'
      | 'gt5years',
  ) {
    const experienceFilterMap: Record<
      Exclude<typeof filter, 'all' | undefined>,
      Prisma.IntFilter
    > = {
      lt3months: { lt: 3 },
      '3to12months': { gte: 3, lt: 12 },
      '1to2years': { gte: 12, lt: 24 },
      '2to5years': { gte: 24, lt: 60 },
      gt5years: { gte: 60 },
    };

    const where: Prisma.UserWhereInput = {
      userRole: { userRole: 'candidate' },
    };

    if (roleSearch?.trim()) {
      where.role = {
        contains: roleSearch.trim(),
        mode: 'insensitive',
      };
    }

    if (filter && filter !== 'all') {
      where.experience = experienceFilterMap[filter];
    }

    const candidates = await this.prisma.user.findMany({
      where,
      include: {
        interview: true,
      },
    });

    const result = candidates.map((c) => {
      return {
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        phone: c.phone,
        role: c.role,
        experience: c.experience,
        createdAt: c.createdAt,
        latestInterview: c.interview,
      };
    });

    if (sort) {
      result.sort((a, b) => {
        const aConf = a.latestInterview?.confidence ?? -1;
        const bConf = b.latestInterview?.confidence ?? -1;

        return sort === 'confidence_asc' ? aConf - bConf : bConf - aConf;
      });
    }

    return { candidates: result };
  }

  async getCandidateById(id: number) {
    const candidate = await this.prisma.user.findFirst({
      where: { id },
      include: {
        interview: true,
      },
    });

    if (!candidate) throw new BadRequestException('No user found');

    return candidate;
  }

  async createCandidate(createUserDto: CreateUserDto) {
    try {
      const existingCandidate = await this.prisma.user.findFirst({
        where: { email: createUserDto.email },
      });

      if (existingCandidate)
        throw new BadRequestException('User with such email already exists');

      const candidateRole = await this.prisma.userRole.findFirst({
        where: { userRole: 'candidate' },
      });

      if (!candidateRole)
        throw new BadRequestException('Error: Initialize Candidate Role First');

      const newUser = await this.prisma.user.create({
        data: { ...createUserDto, userRoleId: candidateRole.id },
      });

      if (!newUser)
        throw new BadRequestException(
          'Error creating user. Try again or contact support',
        );

      return newUser;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error(error);
      throw error;
    }
  }

  async updateCandidate(id: number, editCandidateDto: EditCandidateDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      include: { userRole: true },
    });

    if (!existingUser || existingUser.userRole.userRole !== 'candidate')
      throw new BadRequestException('Bad request');

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...editCandidateDto,
        },
      });
      return updatedUser;
    } catch (error) {
      console.log(error);
      return { status: 'Error', message: 'DB Error' };
    }
  }

  async deleteCandidate(id: number) {
    const candidate = await this.prisma.user.findUnique({ where: { id } });

    if (!candidate) throw new BadRequestException('No such user found');

    try {
      await this.prisma.user.delete({ where: { id } });
      return { status: 'success' };
    } catch (error) {
      console.log(error);
      return { status: 'error', message: 'DB Error' };
    }
  }
}
