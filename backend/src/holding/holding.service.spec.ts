import { Test, TestingModule } from '@nestjs/testing';
import { HoldingService } from './holding.service';

describe('HoldingService', () => {
  let service: HoldingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HoldingService],
    }).compile();

    service = module.get<HoldingService>(HoldingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
