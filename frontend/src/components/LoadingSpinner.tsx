export function LoadingSpinner() {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="relative">
                <div className="h-24 w-24 rounded-full border-b-2 border-t-2 border-indigo-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-500 text-xs tracking-widest">LOADING</div>
            </div>
        </div>
    );
}
