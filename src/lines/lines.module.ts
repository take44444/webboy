import { Module } from '@nestjs/common';
import { LinesRepository } from './lines.repository';

@Module({
  providers: [LinesRepository],
  exports: [LinesRepository],
})
export class LinesModule {}