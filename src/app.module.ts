import { Module } from '@nestjs/common';
import { PokeApiModule } from './poke-api/poke-api.module';

@Module({
  imports: [PokeApiModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
