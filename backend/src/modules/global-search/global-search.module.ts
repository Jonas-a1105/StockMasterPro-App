import { Module } from '@nestjs/common';
import { GlobalSearchController } from './infrastructure/http/global-search.controller';
import { GlobalSearchService } from './application/global-search.service';

@Module({
  controllers: [GlobalSearchController],
  providers: [GlobalSearchService],
  exports: [GlobalSearchService],
})
export class GlobalSearchModule {}