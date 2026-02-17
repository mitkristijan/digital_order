import { Controller, Post, Body, Query } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { Public } from '../common/decorators/roles.decorator';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Public()
  @Post('suggest')
  async getSuggestions(
    @Query('tenantId') tenantId: string,
    @Body() body: { cartItems: Array<{ menuItemId: string; quantity: number }> }
  ) {
    return this.recommendationService.getSuggestions(tenantId, body.cartItems);
  }
}
