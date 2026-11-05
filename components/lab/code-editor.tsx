'use client'

import { python } from '@codemirror/lang-python'
import CodeMirror from '@uiw/react-codemirror'
import { useTheme } from 'next-themes'

export default function CodeEditor({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const { resolvedTheme } = useTheme()
  return (
    <div className="overflow-hidden rounded-md border border-rule text-sm">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={[python()]}
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        minHeight="220px"
        maxHeight="520px"
        aria-label={label}
        basicSetup={{ tabSize: 4 }}
      />
    </div>
  )
}
