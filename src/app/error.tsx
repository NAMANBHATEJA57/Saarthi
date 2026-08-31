'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-red-50 p-6 rounded-lg border border-red-100 text-center">
      <h2 className="text-red-700 font-semibold mb-2">Something went wrong!</h2>
      <p className="text-red-600 text-sm mb-4">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
