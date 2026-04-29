export default function MapBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <svg id="mapSvg" className="w-full h-full" viewBox="0 0 480 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#d4e8c2"/>


        <g stroke="#b8d4a4" strokeWidth="1" fill="none">
           <path d="M0 400 L480 400" />
           <path d="M240 0 L240 800" />
           <path d="M0 0 L480 800" />
           <path d="M480 0 L0 800" />
        </g>


        <rect x="80"  y="160"  width="70" height="50" rx="4" fill="#c5ddb0" opacity="0.7"/>
        <rect x="170" y="130"  width="50" height="40" rx="4" fill="#c5ddb0" opacity="0.6"/>
        <rect x="300" y="280"  width="80" height="60" rx="4" fill="#c5ddb0" opacity="0.65"/>
      </svg>
    </div>
  );
}
