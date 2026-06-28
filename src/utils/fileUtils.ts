// File extraction from AI responses

export interface DetectedFile {
  filename: string;
  language: string;
  content: string;
}

// Extract files from code blocks with filename patterns
// Supports: ```python:filename.py, ```js // filename.js, ``` filename.py
export function extractFilesFromContent(content: string): DetectedFile[] {
  const files: DetectedFile[] = [];
  // Match code blocks: ```lang:filename or ```lang // filename or ``` filename
  const codeBlockRegex = /```(\w+)?[:\s]*(?:\/\/\s*)?([^\n]*)\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'text';
    const potentialFilename = match[2]?.trim();
    const codeContent = match[3];

    // Skip empty or whitespace-only filenames
    if (!potentialFilename || potentialFilename.length === 0) continue;

    // Skip if it looks like just a language tag (no dots, no slashes)
    const looksLikeFilename = /\.\w+$/.test(potentialFilename)
      || /\/./.test(potentialFilename)
      || /^[a-zA-Z0-9_-]+\.[a-z]+$/i.test(potentialFilename);

    if (looksLikeFilename) {
      // Clean up filename - remove leading/trailing quotes and spaces
      const cleanFilename = potentialFilename.replace(/^['"]|['"]$/g, '').trim();
      if (cleanFilename) {
        files.push({
          filename: cleanFilename,
          language,
          content: codeContent,
        });
      }
    }
  }

  return files;
}

// Get MIME type from filename
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'js': 'application/javascript',
    'jsx': 'text/javascript',
    'ts': 'application/typescript',
    'tsx': 'text/typescript',
    'py': 'text/x-python',
    'java': 'text/x-java',
    'cpp': 'text/x-c++',
    'c': 'text/x-c',
    'cs': 'text/x-csharp',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
    'rb': 'text/x-ruby',
    'php': 'text/x-php',
    'html': 'text/html',
    'css': 'text/css',
    'json': 'application/json',
    'xml': 'application/xml',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'sql': 'application/sql',
    'sh': 'application/x-sh',
    'bash': 'application/x-sh',
    'bat': 'application/x-bat',
    'ps1': 'application/x-powershell',
    'dockerfile': 'text/plain',
    'vue': 'text/x-vue',
    'svelte': 'text/x-svelte',
    'swift': 'text/x-swift',
    'kt': 'text/x-kotlin',
    'scala': 'text/x-scala',
    'r': 'text/x-r',
    'lua': 'text/x-lua',
    'dart': 'text/x-dart',
    'toml': 'text/plain',
    'ini': 'text/plain',
    'env': 'text/plain',
  };
  return mimeTypes[ext] || 'text/plain';
}

// Download file from content
export function downloadFile(filename: string, content: string): void {
  const mimeType = getMimeType(filename);
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Get file extension icon
export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const icons: Record<string, string> = {
    'js': '📜',
    'jsx': '⚛️',
    'ts': '📘',
    'tsx': '⚛️',
    'py': '🐍',
    'java': '☕',
    'cpp': '⚙️',
    'c': '⚙️',
    'cs': '🎮',
    'go': '🐹',
    'rs': '🦀',
    'rb': '💎',
    'php': '🐘',
    'html': '🌐',
    'css': '🎨',
    'json': '📋',
    'xml': '📄',
    'yaml': '📋',
    'yml': '📋',
    'md': '📝',
    'txt': '📄',
    'sql': '🗄️',
    'sh': '🖥️',
    'bash': '🖥️',
    'bat': '🖥️',
    'ps1': '🖥️',
    'dockerfile': '🐳',
    'vue': '💚',
    'svelte': '🔥',
    'swift': '🍎',
    'kt': '🟣',
    'scala': '🔴',
    'r': '📊',
    'lua': '🌙',
    'dart': '🎯',
  };
  return icons[ext] || '📄';
}
