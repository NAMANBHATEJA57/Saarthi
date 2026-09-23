import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center py-16">
      <h2 className="text-3xl font-bold mb-4">404 - Not Found</h2>
      <p className="text-gray-600 mb-8">Could not find requested resource</p>
      <Link 
        href="/"
        className="text-green-700 font-semibold hover:underline"
      >
        Return Home
      </Link>
    </div>
  );
}
