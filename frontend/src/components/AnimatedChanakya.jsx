import React from 'react';

export default function AnimatedChanakya({ className = "", style = {} }) {
  return (
    <div className={"flex flex-col items-center justify-center " + className} style={style}>
      <img
        src="/chanakya-home.png"
        alt="Chanakya Financial Guide"
        className="w-[340px] md:w-[410px] rounded-xl shadow-lg mb-2"
        style={{ background: '#f7fafc' }}
      />
      <div className="mt-2 text-center text-base text-blue-100 max-w-md">
        <span className="font-semibold text-orange-200">Meet Chanakya:</span> Your wise financial guide for trust, budgeting, and wellness.
      </div>
    </div>
  );
}
