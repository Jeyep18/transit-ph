import { useState } from "react";

function PinDestination() {
  const [active, setActive] = useState(false);

  return (
    <button
      onClick={() => setActive(!active)}
      className="flex flex-col items-center text-white text-[0.625rem] gap-0.5"
    >
      <div
        className={`p-2  rounded-full flex items-center justify-center transition-colors ${
          active ? "bg-[#003f48]" : "bg-transparent"
        }`}
      >
        <img
          src="/Icons/WhiteDestination.svg"
          className="w-5.5 h-5.5"
        />
      </div>

      Destination
    </button>
  );
}

export default PinDestination;