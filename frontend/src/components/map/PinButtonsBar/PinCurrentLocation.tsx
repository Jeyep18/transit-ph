import { useState } from "react";

function PinCurrentLocation() {

    const [active, setActive]=useState(false);

    return (
        <button 
        onClick={() => setActive(!active)}
        className="text-white text-[0.625rem] flex flex-col items-center gap-0.5"
        >
            <div
            className={`p-2 pb-2 rounded-full flex items-center justify-center transition-colors 
                ${ active ? "bg-[#003f48] pb-2" : "bg-transparent p-0"}`}
            >
            <img src="/Icons/WhiteCurrentLocation.svg" className="w-5.5 h-5.5" />
            </div>
            Current Location
        </button>
    );
}

export default  PinCurrentLocation;