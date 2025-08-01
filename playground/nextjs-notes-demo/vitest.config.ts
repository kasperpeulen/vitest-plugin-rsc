import { defineConfig } from 'vitest/config'
import vitestPluginRSC from 'vitest-plugin-rsc'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react(), vitestPluginRSC()],
  test: {
    testTimeout: 3000,
    restoreMocks: true,
    browser: {
      enabled: true,
      provider: 'preview',
      screenshotFailures: false,
      instances: [{ browser: 'chromium' }]
    },
    setupFiles: ['./test/vitest.setup.ts']
  },
  resolve: {
    alias: {
      // This is somehow needed for the vite plugin to register is as a client component
      'next/link': 'next/dist/client/app-dir/link',
      // 'next/navigation': 'next/dist/client/components/navigation',
      'react-server-dom-webpack/client':
        '@vitejs/plugin-rsc/vendor/react-server-dom/client.browser',

      '@vercel/turbopack-ecmascript-runtime/browser/dev/hmr-client/hmr-client.ts':
        'next/dist/client/dev/noop-turbopack-hmr',
      'next > next/dist/client/dev/hot-reloader/app/hot-reloader-app.js':
        'next/dist/client/dev/noop-turbopack-hmr'
    }
  },
  optimizeDeps: {
    include: [
      'next/navigation',
      'next/dist/server/app-render/types',
      'next/dist/client/components/navigation.react-server'
    ]
  },
  environments: {
    client: {},
    react_client: {
      resolve: {},
      optimizeDeps: {
        // Without this I get commonjs errors
        include: [
          'next/link',
          'next/navigation',
          'marked',
          'sanitize-html',
          'next/dist/shared/lib/app-router-context.shared-runtime',
          'next/dist/shared/lib/hooks-client-context.shared-runtime',
          'next/dist/shared/lib/segment',
          'next/dist/client/components/use-action-queue',
          'next/dist/client/components/app-router-instance',
          'next/dist/client/components/router-reducer/create-initial-router-state',
          'next/dist/client/components/app-router',
          'next/dist/client/components/builtin/global-error',
          'next/dist/client/components/router-reducer/create-initial-router-state',
          'next/dist/shared/lib/app-router-context.shared-runtime',
          'next/dist/shared/lib/hooks-client-context.shared-runtime',
          'next/dist/client/components/use-action-queue',
          'next/dist/client/components/redirect-boundary',
          'next/dist/client/components/router-reducer/compute-changed-path',
          'next/dist/client/components/app-router-instance',
          'next/dist/server/app-render/types'
        ]
      }
    }
  }
})
