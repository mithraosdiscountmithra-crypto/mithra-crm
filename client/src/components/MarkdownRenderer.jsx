import React from 'react';

/**
 * Lightweight, robust Markdown Renderer for AI responses
 * Handles headers, bold, bullet points, blockquotes, inline code, code blocks, and tables.
 */
export default function MarkdownRenderer({ content = '' }) {
  if (!content) return null;

  // Split into lines
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockBuffer = [];
  let codeBlockLang = '';

  let inTable = false;
  let tableHeader = [];
  let tableRows = [];

  const parseInline = (text) => {
    // Process bold **text**, inline `code`, and spans
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    // Regex for bold **text** and inline `code`
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const matchedStr = match[0];
      if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
        parts.push(
          <strong key={keyIdx++} className="font-extrabold text-white">
            {matchedStr.slice(2, -2)}
          </strong>
        );
      } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
        parts.push(
          <code key={keyIdx++} className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono text-[11px]">
            {matchedStr.slice(1, -1)}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const flushTable = (key) => {
    if (tableHeader.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={`table-${key}`} className="my-2.5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
          <table className="w-full text-left text-xs">
            {tableHeader.length > 0 && (
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold">
                <tr>
                  {tableHeader.map((th, idx) => (
                    <th key={idx} className="py-2 px-3 whitespace-nowrap">{parseInline(th)}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/40">
                  {row.map((td, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 whitespace-nowrap">{parseInline(td)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Blocks ```
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <div key={`code-${i}`} className="my-2.5 rounded-xl bg-slate-950 border border-slate-800 p-3 overflow-x-auto font-mono text-xs text-emerald-300 whitespace-pre">
            {codeBlockBuffer.join('\n')}
          </div>
        );
        inCodeBlock = false;
        codeBlockBuffer = [];
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    // Handle Table Rows (| col | col |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      // Check if it's separator row | :--- | :--- |
      if (line.includes('---')) {
        continue;
      }

      const cells = line
        .split('|')
        .slice(1, -1)
        .map(c => c.trim());

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={`empty-${i}`} className="h-1.5" />);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-bold text-white mt-2 mb-1 flex items-center gap-1.5">
          {parseInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-base font-extrabold text-white mt-2.5 mb-1">
          {parseInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-lg font-black text-white mt-3 mb-1">
          {parseInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${i}`} className="my-1.5 pl-3 border-l-2 border-indigo-500/70 text-slate-300 text-xs italic bg-indigo-950/20 py-1 rounded-r-lg">
          {parseInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet points (* or -)
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-0.5 text-xs text-slate-300">
          <span className="text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
          <div className="flex-1">{parseInline(line.trim().slice(2))}</div>
        </div>
      );
      continue;
    }

    // Numbered list (1. item)
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-0.5 text-xs text-slate-300">
          <span className="font-mono text-indigo-400 font-bold shrink-0">{numMatch[1]}.</span>
          <div className="flex-1">{parseInline(numMatch[2])}</div>
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="text-xs text-slate-300 leading-relaxed my-0.5">
        {parseInline(line)}
      </p>
    );
  }

  if (inTable) {
    flushTable('end');
  }

  return <div className="space-y-0.5 text-xs font-normal">{elements}</div>;
}
