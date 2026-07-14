import { Test, TestingModule } from '@nestjs/testing';
import { DividendController } from './dividend.controller';

describe('DividendController', () => {
  let controller: DividendController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DividendController],
    }).compile();

    controller = module.get<DividendController>(DividendController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
