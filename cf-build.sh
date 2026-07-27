#!/bin/bash
set -e

# Fix package.json build script to prevent infinite loop
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));p.scripts.build='next build';fs.writeFileSync('package.json',JSON.stringify(p,null,2));"

# Create correct open-next.config.ts
cat > open-next.config.ts << 'EOF'
const config = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};
export default config;
EOF

# Run OpenNext Cloudflare build (it will call npm run build = next build internally)
npx @opennextjs/cloudflare build
