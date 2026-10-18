import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';
import {
  HEALTH_PATH,
  HEALTH_STATUS_OK,
} from './common/constants/http.constants';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @SkipThrottle()
  @Get(HEALTH_PATH)
  health() {
    return { status: HEALTH_STATUS_OK, timestamp: new Date().toISOString() };
  }
}
