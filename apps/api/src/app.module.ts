import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { LodatsModule } from './modules/lodats/lodats.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { TitleServicesModule } from './modules/title-services/title-services.module';
import { PublicContentModule } from './modules/public-content/public-content.module';
import { LotSharesModule } from './modules/lot-shares/lot-shares.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    StorageModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    AddressesModule,
    LodatsModule,
    TransactionsModule,
    TitleServicesModule,
    PublicContentModule,
    LotSharesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
