import { Module } from '@nestjs/common';
import { TierService } from './tier.service.js';

@Module({
  providers: [TierService],
  exports: [TierService],
})
export class TierModule {}
