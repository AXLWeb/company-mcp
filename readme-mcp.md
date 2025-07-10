# Extended Angular MCP Server

This is an enhanced version of the Angular MCP server that supports multiple resource types and custom URLs.

## Features

### 1. Angular Documentation (Original)

- **Tool**: `get_angular_docs`
- **Parameters**:
  - `section`: 'full', 'summary', or 'both'
- **Usage**: Fetch Angular v20+ documentation and best practices

### 2. Technology Documentation (New)

- **Tool**: `get_tech_docs`
- **Parameters**:
  - `technology`: 'angular', 'typescript', 'rxjs', 'testing', 'nx'
  - `category`: 'docs', 'guides', 'api', 'cli', 'handbook', 'operators', 'jest', 'jasmine', 'recipes'
- **Usage**: Fetch documentation for various technologies

### 3. Custom Resource Fetching (New)

- **Tool**: `get_custom_resource`
- **Parameters**:
  - `url`: Any valid URL
  - `cacheKey`: Optional cache key for the resource
- **Usage**: Fetch content from any URL with caching support

## Supported Technologies

### Angular

- `docs`: Angular documentation
- `guides`: Angular guides
- `api`: Angular API reference
- `cli`: Angular CLI documentation

### TypeScript

- `docs`: TypeScript documentation
- `handbook`: TypeScript handbook

### RxJS

- `docs`: RxJS documentation
- `operators`: RxJS operators guide

### Testing

- `jest`: Jest testing framework
- `jasmine`: Jasmine testing framework

### Nx

- `docs`: Nx documentation
- `recipes`: Nx recipes

## Usage Examples

### MCP Client Usage

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_tech_docs",
    "arguments": {
      "technology": "typescript",
      "category": "handbook"
    }
  }
}
```

### Direct Method Usage

```javascript
const server = new SimpleAngularMCPServer();

// Get Angular docs
const angularDocs = await server.fetchAngularDocs('summary');

// Get TypeScript handbook
const typescriptDocs = await server.fetchTechDocs('typescript', 'handbook');

// Get custom resource
const customContent = await server.fetchCustomResource('https://example.com/docs', 'my-cache-key');
```

## Adding New Resources

To add new resource URLs, extend the `RESOURCE_URLS` object:

```javascript
const RESOURCE_URLS = {
  // ...existing resources...
  newtech: {
    docs: ['https://newtech.com/docs'],
    guides: ['https://newtech.com/guides'],
    api: ['https://newtech.com/api']
  }
};
```

Then update the `technology` enum in the tool schema to include 'newtech'.

## Caching

The server implements intelligent caching:

- Cache keys are based on URL + date (daily cache invalidation)
- Custom cache keys can be provided for custom resources
- Cached responses are served instantly

## Testing

Run the test script to verify functionality:

```bash
node test-mcp-server.js
```

## Integration with VS Code

Add to your `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "angular-extended": {
      "command": "node",
      "args": ["./angular-mcp-simple.js"]
    }
  }
}
```

## Error Handling

The server includes comprehensive error handling:

- Invalid technology names return available options
- Network errors are caught and reported
- Timeout protection (10 seconds) for URL fetching
- Graceful fallback for missing resources
