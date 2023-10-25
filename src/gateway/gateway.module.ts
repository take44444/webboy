import { Module } from '@nestjs/common';
import { Gateway } from './gateway';
import { LinesModule } from 'src/lines/lines.module';

@Module({
  imports: [LinesModule],
  providers: [Gateway],
})
export class GatewayModule {}