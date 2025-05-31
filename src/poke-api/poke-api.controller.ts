import { Controller, Get } from '@nestjs/common';
import { PokeApiService } from './poke-api.service';

@Controller('poke-api')
export class PokeApiController {

  constructor(private readonly pokemonService: PokeApiService ) {}

  @Get()
  getAllPokemon() {
    return this.pokemonService.findAll()
  }
}
