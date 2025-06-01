import { Controller, Get } from '@nestjs/common';
import { PokeApiService } from './poke-api.service';

@Controller('poke-api')
export class PokeApiController {
  constructor(private readonly pokeApiService: PokeApiService) {}

  @Get('simulate')
  async simulateBattle() {
    const log = await this.pokeApiService.simulateBattle();
    return { log };
  }
}