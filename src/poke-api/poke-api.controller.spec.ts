import { Test, TestingModule } from '@nestjs/testing';
import { PokeApiController } from './poke-api.controller';

describe('PokeApiController', () => {
  let controller: PokeApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PokeApiController],
    }).compile();

    controller = module.get<PokeApiController>(PokeApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
