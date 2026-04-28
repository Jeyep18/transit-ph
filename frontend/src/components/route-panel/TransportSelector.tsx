function TransportSelector() {

    
    return (
        <div className="w-86  flex flex-col gap-2 justify-center bg-color-white border-1 border-gray-300 bg-white rounded-lg p-4 shadow-md">
            <h1 className="text-4 font-bold text-[#003F48]">Select Transportation</h1>
            <div className="flex gap-4 justify-center">
                <button className="flex w-[93px] p-[10px] justify-center items-center gap-[10px] 
                bg-[#C2D2CF] text-white rounded-lg hover:bg-[#CC553D]/90">
                    Jeep
                </button>
                <button className="flex w-[93px] p-[10px] justify-center items-center gap-[10px] 
                bg-[#C2D2CF] text-white rounded-lg hover:bg-[#CC553D]/90">
                    Bus
                </button>
                <button className="flex w-[93px] p-[10px] justify-center items-center gap-[10px] 
                bg-[#C2D2CF] text-white rounded-lg hover:bg-[#CC553D]/90">
                    Tricycle
                </button>
            </div>
        </div>
    );
};


export default TransportSelector;