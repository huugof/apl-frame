# A Pattern Language Frame

A Farcaster v2 frame that showcases daily patterns from Christopher Alexander's "A Pattern Language".

## Features

- Displays a random pattern from "A Pattern Language" each day
- Generates AI-powered architectural visualizations for patterns
- Interactive frame with pattern viewing and sharing capabilities
- Daily pattern updates with Redis caching

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd apl
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:
```env
NEXT_PUBLIC_HOST=http://localhost:3000
UPSTASH_REDIS_REST_URL=your_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
OPENAI_API_KEY=your_openai_api_key_here
```

4. Fetch patterns:
```bash
npm run fetch-patterns
```

5. Run the development server:
```bash
npm run dev
```

## Resources

- [Frames v2 specifications](https://docs.farcaster.xyz/developers/frames/v2/spec)
- [A Pattern Language Patterns](https://github.com/zenodotus280/apl-md/tree/70c6d6e7d3c54284724b1cacdf0590bf530c9eaa/Patterns)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 