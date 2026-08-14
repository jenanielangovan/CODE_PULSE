import path from 'path';

const extensionMap: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript (React)',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript (React)',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.py': 'Python',
  '.go': 'Go',
  '.java': 'Java',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.cxx': 'C++',
  '.h': 'C/C++',
  '.hpp': 'C++',
  '.c': 'C',
  '.cs': 'C#',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.rs': 'Rust',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.html': 'HTML',
  '.css': 'CSS',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.md': 'Markdown',
};

/**
 * Detect the programming language from file path or content heuristics.
 * @param filename Optional filename or path
 * @param content Optional raw file content to run heuristics against
 */
export function detectLanguage(filename?: string, content?: string): string {
  // 1. Try file extension first
  if (filename) {
    const ext = path.extname(filename).toLowerCase();
    if (extensionMap[ext]) {
      return extensionMap[ext];
    }
  }

  // 2. Fall back to content heuristics
  if (content) {
    if (/import\s+.*\s+from\s+['"]/g.test(content) || /require\(['"]/g.test(content)) {
      if (content.includes('interface ') || content.includes('type ') || content.includes(': string') || content.includes(': number')) {
        return 'TypeScript';
      }
      return 'JavaScript';
    }
    if (/def\s+\w+\s*\(.*\)\s*:/g.test(content) || /import\s+(os|sys|math|random|json|datetime)/g.test(content)) {
      return 'Python';
    }
    if (/package\s+main/g.test(content) || /func\s+main\(\)/g.test(content)) {
      return 'Go';
    }
    if (/public\s+class\s+\w+/g.test(content) || /import\s+java\./g.test(content)) {
      return 'Java';
    }
    if (/#include\s+<[\w.]+>/g.test(content)) {
      return 'C++';
    }
    if (/fn\s+main\(\)/g.test(content) || /use\s+std::/g.test(content)) {
      return 'Rust';
    }
    if (/using\s+System(\.\w+)*;/g.test(content) || /namespace\s+\w+/g.test(content)) {
      return 'C#';
    }
    if (/<\?php/g.test(content)) {
      return 'PHP';
    }
    if (/<!DOCTYPE\s+html>/gi.test(content) || /<html\b[^>]*>/gi.test(content)) {
      return 'HTML';
    }
    if (/^\s*[\.#\w\-:\s,>\+~]+class\s*\{/gm.test(content) || content.includes('margin:') || content.includes('padding:')) {
      return 'CSS';
    }
  }

  return 'Unknown';
}

export default detectLanguage;
