export default function Loading() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-pulse flex space-x-2">
        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );
}
