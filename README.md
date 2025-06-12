# @longears-mobile/rcs-sdk

A flexible, provider-agnostic SDK for RCS (Rich Communication Services) messaging, designed with a modular architecture that currently supports Longears RCS provider with the ability to extend to other providers in the future.

## Overview

The `@longears-mobile/rcs-sdk` provides a unified interface for sending RCS messages, handling authentication, and managing capabilities detection. It's designed to be extensible, type-safe, and easy to integrate.

## Features

- 🔌 **Provider-Agnostic Design**: Built with a modular architecture to support multiple providers
- 🚀 **Longears Provider**: Ships with full support for the Longears RCS API
- 🔐 **Secure Authentication**: HMAC-based authentication for Longears provider
- 📱 **Rich Messaging**: Send text, media, rich cards, and interactive elements
- 🔄 **Automatic Retries**: Built-in retry logic with exponential backoff
- 📊 **Capability Detection**: Check device and carrier RCS support
- 🛠️ **TypeScript Support**: Fully typed interfaces for better developer experience

## Architecture

The SDK follows an adapter pattern with the following key components:

1. **RCSClient**: Main entry point for SDK usage
2. **Providers**: Adapter implementations for RCS services (currently Longears)
3. **Authentication**: Authentication provider for Longears
4. **Interfaces**: Unified message and capability interfaces

## Quick Start

```typescript
import { RCSClient } from '@longears-mobile/rcs-sdk';

// Initialize with Longears provider
const client = new RCSClient({
  provider: 'longears',
  auth: {
    type: 'longears',
    credentials: {
      apiKey: process.env.LONGEARS_API_KEY,
      apiSecret: process.env.LONGEARS_API_SECRET
    }
  }
});

await client.initialize();

// Send a message
const response = await client.sendMessage({
  to: '+1234567890',
  content: {
    text: 'Hello from Longears RCS!'
  },
  suggestions: [
    { type: 'reply', text: 'Yes' },
    { type: 'reply', text: 'No' }
  ]
});
```

## Supported Providers

- **Longears**: Full support for Longears RCS API

The SDK is designed to be provider-agnostic with Longears as the starting point. The modular architecture makes it easy to add support for other providers in the future.

## Installation

```bash
npm install @longears-mobile/rcs-sdk
```

### Module Formats

The SDK is available in multiple formats:

- **ES Modules** - `import { RCSClient } from '@longears-mobile/rcs-sdk';`
- **CommonJS** - `const { RCSClient } = require('@longears-mobile/rcs-sdk');`
- **UMD** - Available via CDN or direct script tag: `<script src="https://unpkg.com/@longears-mobile/rcs-sdk"></script>`

## Development

See the `docs/` directory for:
- [Design Documentation](./docs/DESIGN.md)
- [API Reference](./docs/API.md)
- [Migration Guide](./docs/MIGRATION.md)
- [Publishing Guide](./docs/PUBLISHING.md)

## Extending with New Providers

The SDK is designed to be easily extended with new RCS providers:

1. Create a new provider class that implements the `RCSProvider` interface
2. Create a corresponding authentication provider that implements the `AuthProvider` interface
3. Update the provider and authentication factories to include your new implementations
4. Update configuration interfaces as needed

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

MIT