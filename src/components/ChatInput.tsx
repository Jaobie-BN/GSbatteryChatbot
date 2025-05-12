'use client';

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <div className="border-t p-4 flex items-center space-x-2">
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        className="flex-1 p-3 border-2 border-gray-300 rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="พิมพ์ข้อความ..."
        disabled={disabled}
      />
      <button
        onClick={onSubmit}
        className="bg-blue-500 text-white rounded-4xl py-3 px-4 hover:bg-blue-600 disabled:bg-gray-400"
        disabled={disabled}
      >
        {disabled ? (
          <i className="fas fa-spinner fa-spin"></i>
        ) : (
          <i className="fas fa-paper-plane"></i>
        )}
      </button>
    </div>
  );
}
