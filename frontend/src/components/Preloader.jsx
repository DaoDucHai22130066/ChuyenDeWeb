import React from 'react';

const Preloader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 bg-opacity-75 backdrop-blur-sm">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-primary font-medium">Đang tải...</p>
            </div>
        </div>
    );
};

export default Preloader;