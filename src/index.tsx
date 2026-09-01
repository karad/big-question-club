import { createAuthentication } from './auth/auth';
import { createApp } from './app';

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return Promise.resolve(
      createApp({ authentication: createAuthentication(env), clientScriptUrl: '/client.js' }).fetch(
        request,
        env,
      ),
    );
  },
};
