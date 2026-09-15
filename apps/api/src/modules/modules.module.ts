import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { FeaturesModule } from './features/features.module.js';

@Module({
  imports: [AuthModule, FeaturesModule],
  exports: [AuthModule, FeaturesModule],
})
export class ModulesModule {}
