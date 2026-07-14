import { Test, TestingModule } from '@nestjs/testing';
import { HoldingController } from './holding.controller';

describe('HoldingController', () => {
  let controller: HoldingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HoldingController],
    }).compile();

    controller = module.get<HoldingController>(HoldingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
