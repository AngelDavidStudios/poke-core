import { Injectable } from '@nestjs/common';

@Injectable()
export class PokeApiService {
  private pokemons = [
    'Bulbasaur',
    'Ivysaur',
    'Venusaur',
    'Charmander',
    'Charmeleon',
    'Charizard',
    'Squirtle',
    'Wartortle',
    'Blastoise',
    'Caterpie',
    'Metapod',
    'Butterfree',
  ];

  findAll() {
    return this.pokemons;
  }
}
