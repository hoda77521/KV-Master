import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Download, FileText } from 'lucide-react';

interface ResultViewProps {
  markdown: string;
}

export const ResultView: React.FC<ResultViewProps> = ({ markdown }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kv-system-prompts.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[700px]">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          确认生成的提示词
        </h2>
        <div className="flex space-x-3">
          <button 
            onClick={handleDownload}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span>保存 .md</span>
          </button>
          <button 
            onClick={handleCopy}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              copied ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '已复制!' : '复制'}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="prose prose-indigo max-w-none bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-indigo-900 border-b pb-4 mb-6" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4 flex items-center before:content-[''] before:w-1 before:h-8 before:bg-indigo-500 before:mr-3 before:rounded" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-slate-700 mt-6 mb-3" {...props} />,
                code: ({node, className, children, ...props}) => {
                    const isBlock = Boolean(className) || String(children).includes('\n');
                    return isBlock ? (
                      <div className="bg-slate-900 text-slate-200 p-4 rounded-lg my-4 overflow-x-auto text-sm font-mono shadow-inner border border-slate-700">
                        <code className={className} {...props}>{children}</code>
                      </div>
                    ) : (
                      <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                    )
                },
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-indigo-300 bg-indigo-50 p-4 italic text-slate-700 rounded-r-lg" {...props} />
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
      </div>
    </div>
  );
};
