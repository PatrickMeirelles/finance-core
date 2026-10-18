import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

export type RequestHandler = (req: Request, res: Response) => void;

let handlerPromise: Promise<RequestHandler> | null = null;

async function bootstrap(): Promise<RequestHandler> {
  const server: Express = express();
  const app = configureApp(
    await NestFactory.create(AppModule, new ExpressAdapter(server)),
  );
  await app.init();
  return (req, res) => {
    void server(req, res);
  };
}

/**
 * Entry point for serverless hosts (Vercel). The Nest application is created
 * once per warm instance and reused across invocations.
 */
export function createHandler(): Promise<RequestHandler> {
  handlerPromise ??= bootstrap();
  return handlerPromise;
}
