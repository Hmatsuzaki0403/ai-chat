export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <main className="text-center max-w-2xl">
        <div className="text-6xl mb-6">🌐</div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          AI多言語チャットボット
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
          AI Multilingual Chatbot
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          多语言对话机器人 / Chatbot Multilingue
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            🚧 準備中 / Coming Soon
          </p>
        </div>
        <p className="text-xs text-gray-400">Powered by Next.js + Vercel</p>
      </main>
    </div>
  );
}
