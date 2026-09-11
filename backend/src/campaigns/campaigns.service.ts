import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignListing } from './entities/campaign-listing.entity.js';
import { CampaignSubmissionLog } from './entities/campaign-submission-log.entity.js';
import { CreateCampaignListingDto } from './dto/create-campaign-listing.dto.js';
import { UpdateCampaignListingDto } from './dto/update-campaign-listing.dto.js';
import { CreateCampaignSubmissionDto } from './dto/create-campaign-submission.dto.js';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(CampaignListing)
    private readonly listingsRepo: Repository<CampaignListing>,
    @InjectRepository(CampaignSubmissionLog)
    private readonly submissionsRepo: Repository<CampaignSubmissionLog>,
  ) {}

  // ── Admin: listing management ─────────────────────────────────────────────

  async createListing(dto: CreateCampaignListingDto): Promise<CampaignListing> {
    const listing = this.listingsRepo.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    return this.listingsRepo.save(listing);
  }

  async findAllListings(includeInactive = false): Promise<CampaignListing[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.listingsRepo.find({
      where,
      order: { platformName: 'ASC', createdAt: 'DESC' },
    });
  }

  async findListingById(id: string): Promise<CampaignListing> {
    const listing = await this.listingsRepo.findOne({ where: { id } });
    if (!listing) {
      throw new NotFoundException(`Campaign listing "${id}" not found`);
    }
    return listing;
  }

  async updateListing(
    id: string,
    dto: UpdateCampaignListingDto,
  ): Promise<CampaignListing> {
    const listing = await this.findListingById(id);
    Object.assign(listing, dto);
    return this.listingsRepo.save(listing);
  }

  async deleteListing(id: string): Promise<{ deleted: boolean }> {
    const listing = await this.findListingById(id);
    await this.listingsRepo.remove(listing);
    return { deleted: true };
  }

  // ── Public/user-facing listing queries ────────────────────────────────────

  async findActiveListings(platformName?: string): Promise<CampaignListing[]> {
    const where: Record<string, any> = { isActive: true };
    if (platformName) {
      where.platformName = platformName;
    }
    return this.listingsRepo.find({
      where,
      order: { platformName: 'ASC', createdAt: 'DESC' },
    });
  }

  async findActiveListingById(id: string): Promise<CampaignListing> {
    const listing = await this.listingsRepo.findOne({
      where: { id, isActive: true },
    });
    if (!listing) {
      throw new NotFoundException(`Campaign listing "${id}" not found`);
    }
    return listing;
  }

  // ── Submission log ────────────────────────────────────────────────────────

  async createSubmission(
    userId: string,
    dto: CreateCampaignSubmissionDto,
  ): Promise<CampaignSubmissionLog> {
    if (!dto.campaignListingId && !dto.freeTextPlatformName) {
      throw new BadRequestException(
        'Provide either a campaignListingId or a freeTextPlatformName',
      );
    }

    if (dto.campaignListingId) {
      // Validate the referenced listing exists and is active
      await this.findActiveListingById(dto.campaignListingId);
    }

    const submission = this.submissionsRepo.create({
      userId,
      campaignListingId: dto.campaignListingId ?? null,
      freeTextPlatformName: dto.freeTextPlatformName ?? null,
      clipJobId: dto.clipJobId ?? null,
      postUrl: dto.postUrl,
      notes: dto.notes ?? null,
    });

    return this.submissionsRepo.save(submission);
  }

  async findMySubmissions(userId: string): Promise<CampaignSubmissionLog[]> {
    return this.submissionsRepo.find({
      where: { userId },
      order: { submittedAt: 'DESC' },
      relations: { campaignListing: true },
    });
  }

  async deleteSubmission(
    id: string,
    userId: string,
  ): Promise<{ deleted: boolean }> {
    const submission = await this.submissionsRepo.findOne({ where: { id } });
    if (!submission) {
      throw new NotFoundException(`Submission log "${id}" not found`);
    }
    if (submission.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this submission',
      );
    }
    await this.submissionsRepo.remove(submission);
    return { deleted: true };
  }
}
