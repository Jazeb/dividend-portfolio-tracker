import { Test, TestingModule } from '@nestjs/testing';
import { DividendService } from './dividend.service';

describe('DividendService', () => {
  let service: DividendService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DividendService],
    }).compile();

    service = module.get<DividendService>(DividendService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
