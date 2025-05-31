import { Module } from '@nestjs/common';
import { PokeApiController } from './poke-api.controller';

@Module({
  controllers: [PokeApiController]
})
export class PokeApiModule {}
