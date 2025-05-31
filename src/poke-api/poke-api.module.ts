import { Module } from '@nestjs/common';
import { PokeApiController } from './poke-api.controller';
import { PokeApiService } from './poke-api.service';

@Module({
  controllers: [PokeApiController],
  providers: [PokeApiService]
})
export class PokeApiModule {}
