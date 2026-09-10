import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clip } from './entities/clip.entity.js';
import { CreateClipDto } from './dto/create-clip.dto.js';
import { UpdateClipDto } from './dto/update-clip.dto.js';

@Injectable()
export class ClipsService {
  constructor(
    @InjectRepository(Clip)
    private readonly clipsRepo: Repository<Clip>,
  ) {}

  async create(dto: CreateClipDto): Promise<Clip> {
    const clip = this.clipsRepo.create(dto);
    return this.clipsRepo.save(clip);
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ data: Clip[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.clipsRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Clip> {
    const clip = await this.clipsRepo.findOne({ where: { id } });
    if (!clip) throw new NotFoundException(`Clip #${id} not found`);
    return clip;
  }

  async update(id: number, dto: UpdateClipDto): Promise<Clip> {
    const clip = await this.findOne(id);
    Object.assign(clip, dto);
    return this.clipsRepo.save(clip);
  }

  async remove(id: number): Promise<void> {
    const clip = await this.findOne(id);
    await this.clipsRepo.remove(clip);
  }
}
