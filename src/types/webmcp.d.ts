interface WebMcpToolExecuteOptions {
  signal?: AbortSignal;
}

interface WebMcpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input: unknown, options?: WebMcpToolExecuteOptions) => Promise<unknown>;
}

interface ModelContext {
  registerTool: (tool: WebMcpToolDefinition) => Promise<void> | void;
}

interface Document {
  modelContext?: ModelContext;
}
