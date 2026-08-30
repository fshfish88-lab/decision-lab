import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.fshfish.decisionlab',
  appName: 'Decision Lab',
  webDir: 'dist',
  server: {
    hostname: 'decision.fshfish.com',
    androidScheme: 'https',
  },
}

export default config
