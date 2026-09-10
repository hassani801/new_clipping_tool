import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ClipsModule } from './modules/clips/clips.module.js';
import { Clip } from './modules/clips/entities/clip.entity.js';

@Module({
  imports: [
    // ── Config (reads .env) ───────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true }),

    // ── Database ──────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DB_DATABASE', 'db.sqlite'),
        entities: [Clip],
        synchronize: true, // auto-migrate; disable in production
        logging: false,
      }),
    }),

    // ── Feature modules ───────────────────────────────────────────────────
    ClipsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
