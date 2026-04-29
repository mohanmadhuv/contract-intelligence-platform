export function GovSignature() {
  return (
    <a
      href="https://canada.ca"
      className="flex items-center gap-3 hover:opacity-90 transition-opacity"
      title="Government of Canada / Gouvernement du Canada"
    >
      {/* Canadian flag - accurate proportions */}
      <svg
        width="48"
        height="32"
        viewBox="0 0 960 640"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Red sections */}
        <rect width="240" height="640" fill="#FF0000" />
        <rect x="720" width="240" height="640" fill="#FF0000" />

        {/* White section */}
        <rect x="240" width="480" height="640" fill="#FFFFFF" />

        {/* Maple leaf - centered */}
        <g transform="translate(480, 320)">
          {/* Maple leaf points */}
          <path
            d="M 0,-180 L 40,-80 L 120,-80 L 60,0 L 100,80 L 20,20 L -20,80 L -100,-80 L -40,-80 Z"
            fill="#FF0000"
          />
          {/* Center circle */}
          <circle cx="0" cy="0" r="25" fill="#FF0000" />
        </g>
      </svg>

      {/* Bilingual text */}
      <div className="flex flex-col leading-tight">
        <div className="text-[14px] font-bold text-black">
          Government<br />of Canada
        </div>
        <div className="text-[12px] font-normal text-gray-700">
          Gouvernement<br />du Canada
        </div>
      </div>
    </a>
  );
}
