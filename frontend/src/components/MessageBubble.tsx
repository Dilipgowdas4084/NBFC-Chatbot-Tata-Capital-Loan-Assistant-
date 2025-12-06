import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
    role: 'user' | 'bot';
    content: string;
}

const MessageBubble: React.FC<Props> = ({ role, content }) => {
    const isUser = role === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none shadow-sm'
                    }`}
            >
                {isUser ? (
                    <p className="text-sm md:text-base">{content}</p>
                ) : (
                    <div className="text-sm md:text-base prose prose-sm max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                // Style tables
                                table: ({ children }) => (
                                    <table className="min-w-full border-collapse my-3 text-xs md:text-sm">
                                        {children}
                                    </table>
                                ),
                                thead: ({ children }) => (
                                    <thead className="bg-blue-50">{children}</thead>
                                ),
                                th: ({ children }) => (
                                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                                        {children}
                                    </th>
                                ),
                                td: ({ children }) => (
                                    <td className="border border-gray-300 px-3 py-2 text-gray-600">
                                        {children}
                                    </td>
                                ),
                                tr: ({ children }) => (
                                    <tr className="even:bg-gray-50 hover:bg-blue-50/50">
                                        {children}
                                    </tr>
                                ),
                                // Style headings
                                h1: ({ children }) => (
                                    <h1 className="text-lg font-bold text-gray-800 mb-2">{children}</h1>
                                ),
                                h2: ({ children }) => (
                                    <h2 className="text-base font-bold text-gray-800 mb-2">{children}</h2>
                                ),
                                // Style bold text
                                strong: ({ children }) => (
                                    <strong className="font-semibold text-gray-900">{children}</strong>
                                ),
                                // Style lists
                                ul: ({ children }) => (
                                    <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
                                ),
                                li: ({ children }) => (
                                    <li className="text-gray-700">{children}</li>
                                ),
                                // Style paragraphs
                                p: ({ children }) => (
                                    <p className="mb-2 last:mb-0">{children}</p>
                                ),
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
