import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dtos/createUser.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async getAllUsers() {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getCandidatesForEmployer(roleSearch?: string, sort?: string) {
    const candidates = await this.prisma.user.findMany({
      where: { userRole: { userRole: 'candidate' } },
      include: {
        interviews: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    let filtered = candidates;
    if (roleSearch?.trim()) {
      const search = roleSearch.trim().toLowerCase();
      filtered = filtered.filter((c) => c.role.toLowerCase().includes(search));
    }

    const withLatest = filtered.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      role: c.role,
      experience: c.experience,
      createdAt: c.createdAt,
      latestInterview: c.interviews[0]
        ? {
            confidence: c.interviews[0].confidence,
            label: c.interviews[0].label,
            createdAt: c.interviews[0].createdAt,
          }
        : null,
    }));

    if (sort === 'confidence_asc') {
      withLatest.sort((a, b) => {
        const ac = a.latestInterview?.confidence ?? -1;
        const bc = b.latestInterview?.confidence ?? -1;
        return ac - bc;
      });
    } else if (sort === 'confidence_desc') {
      withLatest.sort((a, b) => {
        const ac = a.latestInterview?.confidence ?? -1;
        const bc = b.latestInterview?.confidence ?? -1;
        return bc - ac;
      });
    }

    return { candidates: withLatest };
  }

  async getCandidateById(id: number) {
    const candidate = await this.prisma.user.findFirst({ where: { id } });

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
        throw new BadRequestException(
          'Send this message to support: Initialize Candidate Role First',
        );

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
}
