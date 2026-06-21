import { DiffEditor } from '@monaco-editor/react';
import { useTheme } from '@/store/theme';

const monacoLang: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
};

interface CodeDiffProps {
  original: string;
  modified: string;
  language: string;
  height?: string;
}

export function CodeDiff({ original, modified, language, height = '100%' }: CodeDiffProps) {
  const theme = useTheme((s) => s.theme);
  return (
    <DiffEditor
      height={height}
      language={monacoLang[language] || 'plaintext'}
      original={original}
      modified={modified}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      options={{
        readOnly: true,
        renderSideBySide: true,
        fontSize: 13,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
}
