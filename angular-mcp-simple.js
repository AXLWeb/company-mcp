#!/usr/bin/env node

const https = require('https');
const http = require('http');
const url = require('url');

const ANGULAR_DOCS_URLS = ['https://angular.dev/context/llm-files/llms-full.txt', 'https://angular.dev/llms.txt'];

// Extended resource configuration
const RESOURCE_URLS = {
	angular: {
		docs: ['https://angular.dev/context/llm-files/llms-full.txt', 'https://angular.dev/llms.txt'],
		guides: ['https://angular.dev/guide', 'https://angular.dev/tutorial'],
		api: ['https://angular.dev/api'],
		cli: ['https://angular.dev/cli']
	},
	typescript: {
		docs: ['https://www.typescriptlang.org/docs/'],
		handbook: ['https://www.typescriptlang.org/docs/handbook/']
	},
	rxjs: {
		docs: ['https://rxjs.dev/guide/overview'],
		operators: ['https://rxjs.dev/guide/operators']
	},
	testing: {
		jest: ['https://jestjs.io/docs/getting-started']
	},
	nx: {
		docs: ['https://nx.dev/getting-started/intro'],
		recipes: ['https://nx.dev/recipes']
	},
	company: {
		styleguide: ['https://company.com/styleguide'],
		uilibraries: ['https://design.company.com'],
		apis: ['https://company.com/api-docs']
	}
};

// Simple MCP server without external dependencies
class SimpleAngularMCPServer {
	constructor() {
		this.cache = new Map();
		this.setupStdioHandlers();
	}

	setupStdioHandlers() {
		process.stdin.setEncoding('utf8');
		process.stdin.on('readable', () => {
			const chunk = process.stdin.read();
			if (chunk !== null) {
				this.handleRequest(chunk.trim());
			}
		});
	}

	async handleRequest(data) {
		try {
			const request = JSON.parse(data);
			let response;

			switch (request.method) {
				case 'initialize':
					response = {
						jsonrpc: '2.0',
						id: request.id,
						result: {
							protocolVersion: '2024-11-05',
							capabilities: {
								tools: {},
								resources: {}
							},
							serverInfo: {
								name: 'angular-docs-mcp',
								version: '1.0.0'
							}
						}
					};
					break;

				case 'tools/list':
					response = {
						jsonrpc: '2.0',
						id: request.id,
						result: {
							tools: [
								{
									name: 'get_angular_docs',
									description: 'Fetch latest Angular v20+ documentation and best practices',
									inputSchema: {
										type: 'object',
										properties: {
											section: {
												type: 'string',
												description: 'Specific section to fetch',
												enum: ['full', 'summary', 'both']
											}
										}
									}
								},
								{
									name: 'get_tech_docs',
									description: 'Fetch documentation for various technologies (Angular, TypeScript, RxJS, Jest, Nx)',
									inputSchema: {
										type: 'object',
										properties: {
											technology: {
												type: 'string',
												description: 'Technology to fetch docs for',
												enum: ['angular', 'typescript', 'rxjs', 'testing', 'nx']
											},
											category: {
												type: 'string',
												description: 'Specific category within the technology',
												enum: ['docs', 'guides', 'api', 'cli', 'handbook', 'operators', 'jest', 'jasmine', 'recipes']
											}
										},
										required: ['technology']
									}
								},
								{
									name: 'get_custom_resource',
									description: 'Fetch content from a custom URL',
									inputSchema: {
										type: 'object',
										properties: {
											url: {
												type: 'string',
												description: 'URL to fetch content from'
											},
											cacheKey: {
												type: 'string',
												description: 'Optional cache key for the resource'
											}
										},
										required: ['url']
									}
								}
							]
						}
					};
					break;

				case 'tools/call': {
					const toolName = request.params.name;
					const args = request.params.arguments || {};

					let content = '';

					if (toolName === 'get_angular_docs') {
						content = await this.fetchAngularDocs(args.section || 'both');
					} else if (toolName === 'get_tech_docs') {
						content = await this.fetchTechDocs(args.technology, args.category);
					} else if (toolName === 'get_custom_resource') {
						content = await this.fetchCustomResource(args.url, args.cacheKey);
					}

					response = {
						jsonrpc: '2.0',
						id: request.id,
						result: {
							content: [
								{
									type: 'text',
									text: content
								}
							]
						}
					};
					break;
				}

				default:
					response = {
						jsonrpc: '2.0',
						id: request.id,
						error: {
							code: -32601,
							message: 'Method not found'
						}
					};
			}

			this.sendResponse(response);
		} catch (error) {
			this.sendError(request?.id || null, error.message);
		}
	}

	async fetchAngularDocs(section = 'both') {
		try {
			let urlsToFetch;
			if (section === 'full') {
				urlsToFetch = [ANGULAR_DOCS_URLS[0]];
			} else if (section === 'summary') {
				urlsToFetch = [ANGULAR_DOCS_URLS[1]];
			} else {
				urlsToFetch = ANGULAR_DOCS_URLS;
			}

			const docs = await Promise.all(
				urlsToFetch.map(async docUrl => {
					const cacheKey = `${docUrl}-${new Date().toDateString()}`;
					if (this.cache.has(cacheKey)) {
						return this.cache.get(cacheKey);
					}

					const content = await this.fetchUrl(docUrl);
					this.cache.set(cacheKey, content);
					return content;
				})
			);

			return `# Angular v20+ Documentation and Best Practices\n\n${docs.join('\n\n---\n\n')}`;
		} catch (error) {
			return `Error fetching Angular documentation: ${error.message}`;
		}
	}

	async fetchTechDocs(technology, category) {
		try {
			const techConfig = RESOURCE_URLS[technology];
			if (!techConfig) {
				return `Error: Technology '${technology}' not found. Available: ${Object.keys(RESOURCE_URLS).join(', ')}`;
			}

			let urlsToFetch;
			if (category && techConfig[category]) {
				urlsToFetch = techConfig[category];
			} else {
				// Get all URLs for the technology
				urlsToFetch = Object.values(techConfig).flat();
			}

			const docs = await Promise.all(
				urlsToFetch.map(async docUrl => {
					const cacheKey = `${docUrl}-${new Date().toDateString()}`;
					if (this.cache.has(cacheKey)) {
						return this.cache.get(cacheKey);
					}

					const content = await this.fetchUrl(docUrl);
					this.cache.set(cacheKey, content);
					return content;
				})
			);

			const title = `# ${technology.toUpperCase()} Documentation`;
			const categoryPart = category ? ` - ${category}` : '';
			return `${title}${categoryPart}\n\n${docs.join('\n\n---\n\n')}`;
		} catch (error) {
			return `Error fetching ${technology} documentation: ${error.message}`;
		}
	}

	async fetchCustomResource(url, cacheKey) {
		try {
			const key = cacheKey || `${url}-${new Date().toDateString()}`;

			if (this.cache.has(key)) {
				return this.cache.get(key);
			}

			const content = await this.fetchUrl(url);
			this.cache.set(key, content);

			return `# Custom Resource from ${url}\n\n${content}`;
		} catch (error) {
			return `Error fetching custom resource from ${url}: ${error.message}`;
		}
	}

	fetchUrl(urlString) {
		return new Promise((resolve, reject) => {
			const parsedUrl = url.parse(urlString);
			const client = parsedUrl.protocol === 'https:' ? https : http;

			const req = client.get(urlString, res => {
				let data = '';

				res.on('data', chunk => {
					data += chunk;
				});

				res.on('end', () => {
					if (res.statusCode >= 200 && res.statusCode < 300) {
						resolve(data);
					} else {
						reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
					}
				});
			});

			req.on('error', error => {
				reject(error);
			});

			req.setTimeout(10000, () => {
				req.destroy();
				reject(new Error('Request timeout'));
			});
		});
	}

	sendResponse(response) {
		process.stdout.write(JSON.stringify(response) + '\n');
	}

	sendError(id, message) {
		const errorResponse = {
			jsonrpc: '2.0',
			id: id,
			error: {
				code: -32603,
				message: message
			}
		};
		this.sendResponse(errorResponse);
	}
}

// Start the server
if (require.main === module) {
	new SimpleAngularMCPServer();
	console.error('Angular MCP Server started'); // Log to stderr so it doesn't interfere with MCP protocol
}

module.exports = SimpleAngularMCPServer;
