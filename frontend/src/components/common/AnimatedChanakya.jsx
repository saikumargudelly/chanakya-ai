import React from 'react';

export default function AnimatedChanakya({ className = "", style = {} }) {
  return (
    <div className={"flex flex-col items-center justify-center " + className} style={style}>
      <svg
        width="370" height="400" viewBox="0 0 370 400" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-2"
      >
        {/* Central white circle background */}
        <circle cx="185" cy="190" r="170" fill="#fff" opacity="0.98" />
        {/* Floating coins (animated) */}
        <g>
          <circle cx="85" cy="65" r="22" fill="#FFE066" stroke="#FFD700" strokeWidth="3">
            <animate attributeName="cy" values="65;60;65" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <text x="75" y="73" fontSize="22" fill="#B97A3A" fontWeight="bold">$</text>
        </g>
        <g>
          <circle cx="290" cy="85" r="16" fill="#FFE066" stroke="#FFD700" strokeWidth="2">
            <animate attributeName="cy" values="85;90;85" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x="282" y="93" fontSize="16" fill="#B97A3A" fontWeight="bold">$</text>
        </g>
        {/* Bar chart icons */}
        <g>
          <rect x="270" y="170" width="8" height="26" rx="3" fill="#D6E4FF" />
          <rect x="282" y="182" width="8" height="14" rx="3" fill="#6A8BFF" />
          <rect x="294" y="175" width="8" height="21" rx="3" fill="#6A8BFF" />
        </g>
        {/* Lock icon */}
        <g>
          <rect x="260" y="270" width="38" height="32" rx="9" fill="#EAF0FA" stroke="#BFD4F6" strokeWidth="2" />
          <ellipse cx="279" cy="270" rx="9" ry="7" fill="#BFD4F6" />
          <rect x="274" y="282" width="10" height="13" rx="5" fill="#6A8BFF" />
        </g>
        {/* Speech bubble (animated up/down) */}
        <g>
          <g>
            <rect x="60" y="38" rx="18" width="110" height="45" fill="#F7FAFC" stroke="#D6E4FF" strokeWidth="2">
              <animate attributeName="y" values="38;32;38" dur="2.5s" repeatCount="indefinite" />
            </rect>
            <polygon points="110,83 120,95 130,83" fill="#F7FAFC" stroke="#D6E4FF" strokeWidth="2" />
            <text x="75" y="65" fontSize="15" fill="#6A8BFF">Trust | Budget | Wellness</text>
          </g>
        </g>
        {/* Monk body */}
        <ellipse cx="185" cy="315" rx="90" ry="32" fill="#EAF0FA" />
        {/* Monk robe and hand (waving) */}
        <g>
          <path d="M108 260 Q185 390 262 260 Q185 310 108 260" fill="#E86A34" stroke="#B94B1E" strokeWidth="4" />
          <ellipse cx="245" cy="330" rx="23" ry="12" fill="#F9E4B7" stroke="#E3C17A" strokeWidth="2">
            <animate attributeName="cy" values="330;320;330" dur="2s" repeatCount="indefinite" />
          </ellipse>
        </g>
        {/* Monk head */}
        <ellipse cx="185" cy="170" rx="66" ry="76" fill="#F9E4B7" stroke="#E3C17A" strokeWidth="4" />
        {/* Tilak (animated) */}
        <rect x="170" y="140" width="30" height="18" rx="9" fill="#E86A34">
          <animate attributeName="y" values="140;132;140" dur="1.5s" repeatCount="indefinite" />
        </rect>
        {/* Eyes (blinking) */}
        <ellipse cx="168" cy="190" rx="10" ry="5" fill="#222" >
          <animate attributeName="ry" values="5;1;5" keyTimes="0;0.5;1" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="202" cy="190" rx="10" ry="5" fill="#222" >
          <animate attributeName="ry" values="5;1;5" keyTimes="0;0.5;1" dur="2s" repeatCount="indefinite" />
        </ellipse>
        {/* Brows */}
        <path d="M155 180 Q168 170 180 180" stroke="#222" strokeWidth="2" fill="none" />
        <path d="M190 180 Q202 170 215 180" stroke="#222" strokeWidth="2" fill="none" />
        {/* Mustache + Beard */}
        <ellipse cx="185" cy="205" rx="20" ry="7" fill="#B97A3A" />
        <ellipse cx="185" cy="220" rx="9" ry="8" fill="#222" />
        {/* Chin hand (thinking pose) */}
        <ellipse cx="205" cy="235" rx="17" ry="7" fill="#F9E4B7" stroke="#E3C17A" strokeWidth="2" />
        <ellipse cx="220" cy="225" rx="7" ry="5" fill="#F9E4B7" stroke="#E3C17A" strokeWidth="2" />
        {/* Ear */}
        <ellipse cx="120" cy="170" rx="13" ry="23" fill="#F9E4B7" stroke="#E3C17A" strokeWidth="2" />
        <ellipse cx="250" cy="170" rx="13" ry="23" fill="#F9E4B7" stroke="#E3C17A" strokeWidth="2" />
      </svg>
      <div className="mt-2 text-center text-base text-blue-100 max-w-md">
        <span className="font-semibold text-orange-200">Meet Chanakya:</span> Your wise financial guide for trust, budgeting, and wellness.
      </div>
    </div>
  );
}
