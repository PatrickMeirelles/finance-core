// Vercel serverless entry point. The NestJS app is compiled to `dist/` by
// `pnpm build` (see vercel.json) and bootstrapped once per warm instance.
const { createHandler } = require('../dist/serverless');

module.exports = async (req, res) => {
  const handler = await createHandler();
  return handler(req, res);
};
