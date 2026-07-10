import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { GlobalSearchService } from '@modules/global-search/application/global-search.service';
import { GlobalSearchResult } from '@modules/global-search/application/global-search.service';

@ApiTags('Global Search')
@ApiBearerAuth()
@Controller('global-search')
export class GlobalSearchController {
  constructor(private readonly searchService: GlobalSearchService) {}

  @Get()
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Búsqueda global unificada' })
  @ApiQuery({ name: 'q', required: true, description: 'Término de búsqueda (mín. 2 caracteres)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de resultados (default 10)' })
  async search(
    @Query('q') query: string,
    @Query('limit') limit: number | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GlobalSearchResult[]> {
    if (!query || query.length < 2) return [];
    return this.searchService.search(user.tenantId, query, limit ?? 10);
  }
}