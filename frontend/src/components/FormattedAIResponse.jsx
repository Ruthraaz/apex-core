import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function FormattedAIResponse({ content }) {
    if (!content) return null;

    return (
        <div className="prose prose-invert max-w-none text-zinc-300 text-xs leading-relaxed">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-base font-semibold text-zinc-100 mt-3 mb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-sm font-semibold text-[#2be29d] mt-2 mb-1 font-mono uppercase text-[11px] tracking-wider" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-xs font-semibold text-zinc-200 mt-2 mb-1" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-2 leading-relaxed text-zinc-300" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold text-[#2be29d]" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2 text-zinc-300" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2 text-zinc-300" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-0.5 text-zinc-300" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}