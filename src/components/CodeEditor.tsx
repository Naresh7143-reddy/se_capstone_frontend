import Editor from '@monaco-editor/react';
import { useTheme } from '@/store/theme';

// Map our language keys to Monaco's language ids.
const monacoLang: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
};

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  height = '100%',
}: CodeEditorProps) {
  const theme = useTheme((s) => s.theme);

  return (
    <Editor
      height={height}
      language={monacoLang[language] || 'plaintext'}
      value={value}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      onChange={(v) => onChange(v ?? '')}
      options={{
        readOnly,
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        padding: { top: 14 },
        lineNumbersMinChars: 3,
        renderLineHighlight: 'line',
      }}
      loading={
        <div className="grid h-full place-items-center text-sm text-muted">
          Loading editor…
        </div>
      }
    />
  );
}
