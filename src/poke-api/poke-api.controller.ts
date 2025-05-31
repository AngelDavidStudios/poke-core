import { Controller, Get } from '@nestjs/common';

@Controller('poke-api')
export class PokeApiController {

  @Get()
  getAllPokemon() {
    return [
      'Bulbasaur',
      'Ivysaur',
      'Venusaur',
    ]
  }
}
