import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { CharacterUnavailableError } from '../application/errors';
import { GetCharacterOverview } from '../application/get-character-overview';
import { GetLevelHistory } from '../application/get-level-history';
import { toLevelEventDto, toOverviewDto } from './character.dto';

@Controller('character')
export class CharacterController {
  constructor(
    private readonly getOverview: GetCharacterOverview,
    private readonly getHistory: GetLevelHistory,
  ) {}

  @Get()
  async overview() {
    try {
      return toOverviewDto(await this.getOverview.execute());
    } catch (error) {
      if (error instanceof CharacterUnavailableError)
        throw new ServiceUnavailableException(error.message);
      throw error;
    }
  }

  @Get('history')
  async history() {
    return (await this.getHistory.execute()).map(toLevelEventDto);
  }
}
