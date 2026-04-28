"use client";

function RouteSuggestionCard({ route, type, distance, fare}) {
   
   function showRouteAlert(){
    alert(`Showing route: ${route}`);
   }
   
    const typeImages = {
        jeep: "/Icons/Jeep.svg",
        ejeep: "/Icons/EJeepIcon.svg",
        tricycle: "/Icons/TricycleIcon.svg",
    };

    return (
    <div className="min-h-29.5 w-95 bg-white rounded-lg shadow-md flex items-center p-3 gap-2 m-2">

        <img
            src={typeImages[type.toLowerCase()]}
            alt={`${type} Icon`}
            className="w-25.75  h-24.25"
        />

        <div className="flex flex-col w-full">
            <div>
                <h2 className="font-extrabold text-[#CC553D]">{type}: {route}</h2>
                <div className="flex flex-wrap gap-2">
                    <h3 className="font-semibold text-[#003F48]">Distance: {distance}</h3>
                    <h3 className="font-semibold text-[#003F48] ">Fare: {fare}</h3>
                </div>
            </div>

            <div className="flex justify-end mt-2">
            <button
                className="bg-[#CC553D] text-white text-xs rounded-lg p-1.5 hover:bg-sky-500"
                onClick={showRouteAlert}
            >
                <img
                    src="/Icons/Map.svg"
                    alt="Arrow Icon"
                    className="w-4 h-4 inline-block ml-1 m-1"
                />
                Show Route
            </button>
            </div>

        </div>
    </div>
    );
}

export default RouteSuggestionCard;  