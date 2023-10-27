import { Module } from '@nestjs/common';
import { GatewayModule } from './gateway/gateway.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    GatewayModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'www'),
      serveStaticOptions: {
        redirect: false,
      },
    })
  ],
})
export class AppModule {}
