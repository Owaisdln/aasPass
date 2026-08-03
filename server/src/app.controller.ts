import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      success: true,
      message: 'aasPass Backend is running successfully 🚀',
    };
  }
}