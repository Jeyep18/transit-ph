import RouteSuggestionCard from "../results/RouteSuggestionCard";
function BottomSheet(){
    const suggestedRoutes = [ 
        {id: 1, type: 'EJeep', name: 'Centro - Panganiban - Del Rosario', distance: '2.5 km', fare: 'Php 20'},
        {id: 2, type: 'Jeep', name: 'Centro - Panganiban - Del Rosario', distance: '2.5 km', fare: 'Php 20'},
        {id: 3, type: 'Tricycle', name: 'Centro - Panganiban - Del Rosario', distance: '2.5 km', fare: 'Php 15'},

    ];

    return(
<div className="relative flex flex-col items-center bg-[#003F48] w-[393px] rounded-t-md pb-4">
    {/* The X Button - pinned to top right */}
    <button className="absolute right-4 top-4 text-white text-sm">✕</button>

    {/* Handle Bar */}
    <div className="bg-gray-100 h-1.5 w-20 m-2 rounded-full"></div>

    {/* Title */}
    <div className="flex justify-center items-center">
        <h1 className="text-white text-xs mt-0">Suggested Routes</h1>
    </div>

    {/* Cards */}
    <RouteSuggestionCard route={suggestedRoutes[0].name} type={suggestedRoutes[0].type} distance={suggestedRoutes[0].distance} fare={suggestedRoutes[0].fare}/>
    <RouteSuggestionCard route={suggestedRoutes[1].name} type={suggestedRoutes[1].type} distance={suggestedRoutes[1].distance} fare={suggestedRoutes[1].fare}/>
    <RouteSuggestionCard route={suggestedRoutes[2].name} type={suggestedRoutes[2].type} distance={suggestedRoutes[2].distance} fare={suggestedRoutes[2].fare}/>
</div>
    );
}

export default BottomSheet;