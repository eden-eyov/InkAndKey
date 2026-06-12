import { Link } from 'react-router-dom';

function LockedContent({
  reason = 'This content is locked.',
  isGuest = false,
  showRegisterLink = true,
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-cream/45 backdrop-blur-[2px] px-6">
      <div className="bg-ink text-cream rounded-2xl shadow-md p-5 text-center max-w-sm border border-ink/10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#c1a58d] block mb-2">
          Locked
        </span>

        <p className="text-sm text-cream/85 leading-relaxed">
          {reason}
        </p>

        {isGuest && showRegisterLink && (
          <Link
            to="/register"
            className="inline-block mt-4 text-sm font-medium text-[#c1a58d] hover:text-cream transition"
          >
            Create an account to unlock more
          </Link>
        )}
      </div>
    </div>
  );
}

export default LockedContent;