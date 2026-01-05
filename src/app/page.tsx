import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h2 className="text-xl font-bold mb-2">ZEZE BOOST</h2>
            <p className="text-gray-600 mb-4">
              滋賀県大津市膳所地域のデータカードを閲覧し、議論を始めることができます。
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/data"
                className="flex-1 text-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                データを見る
              </Link>
              <Link
                href="/discussions"
                className="flex-1 text-center py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                議論に参加する
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
