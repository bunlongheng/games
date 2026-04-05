"use client";
import { usePageMeta } from "@/lib/usePageMeta";

import React, { useState } from "react";

// Updated Fruit Data with SVG parts for precise coloring
const FRUITS = [
    {
        name: "Grapes",
        icon: "🍇",
        parts: [
            "M50,30 Q40,20 30,30 Q20,40 30,50 Q40,60 50,50 Q60,40 50,30",
            "M30,50 Q20,40 10,50 Q0,60 10,70 Q20,80 30,70 Q40,60 30,50",
            "M70,50 Q80,40 90,50 Q100,60 90,70 Q80,80 70,70 Q60,60 70,50",
            "M50,70 Q40,60 30,70 Q20,80 30,90 Q40,100 50,90 Q60,80 50,70",
            "M50,10 L50,30", // Stem
        ],
    },
    { name: "Orange", icon: "🍊", parts: ["M50,50 m-40,0 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0"] },
    { name: "Strawberry", icon: "🍓", parts: ["M50,90 C20,80 10,50 50,10 C90,50 80,80 50,90"] },
    { name: "Rose Apple", icon: "🍎", parts: ["M50,85 C20,85 15,20 50,20 C85,20 80,85 50,85"] },
    { name: "Banana", icon: "🍌", parts: ["M20,30 Q50,10 80,70 Q50,90 20,30"] },
];

const COLORS = ["#FF3333", "#FF8800", "#FFD700", "#99FF00", "#00FF00", "#00FFFF", "#007FFF", "#8B00FF", "#FF00FF"];

export default function ColoringIsland() {
    usePageMeta({
        title: "coloring island - Games",
        description: "coloring island",
    });
    const [activeFruit, setActiveFruit] = useState(0);
    const [brushColor, setBrushColor] = useState(COLORS[0]);
    const [canvasState, setCanvasState] = useState<Record<string, string>>({});

    const handlePaint = (partId: string) => {
        setCanvasState((prev) => ({ ...prev, [partId]: brushColor }));
    };

    const clearCanvas = () => setCanvasState({});

    return (
        <div className="h-screen w-full bg-[#87CEEB] flex flex-col p-6 font-sans select-none overflow-hidden" style={{ cursor: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' style='font-size:30px'><text y='30'>🪣</text></svg>"), pointer` }}>
            {/* TOP NAV BAR */}
            <div className="flex justify-between items-center mb-8 px-4">
                <h1 className="text-5xl font-black text-white drop-shadow-md italic">
                    Coloring <span className="text-orange-400">Island</span>
                </h1>
                <div className="flex gap-4">
                    <button onClick={clearCanvas} className="w-14 h-14 bg-yellow-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-transform">
                        ↺
                    </button>
                    <button className="w-14 h-14 bg-orange-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-2xl text-white">↓</button>
                </div>
            </div>

            <div className="flex flex-1 gap-8 px-4">
                {/* FRUIT SELECTION */}
                <div className="w-28 bg-white/90 rounded-[40px] border-4 border-blue-300 p-4 flex flex-col gap-6 shadow-xl">
                    {FRUITS.map((fruit, idx) => (
                        <button
                            key={fruit.name}
                            onClick={() => {
                                setActiveFruit(idx);
                                clearCanvas();
                            }}
                            className={`aspect-square rounded-3xl flex items-center justify-center text-4xl transition-all ${activeFruit === idx ? "bg-blue-200 border-4 border-blue-500 scale-110" : "bg-transparent border-2 border-transparent grayscale opacity-50"}`}>
                            {fruit.icon}
                        </button>
                    ))}
                </div>

                {/* CANVAS AREA */}
                <div className="flex-1 bg-white rounded-[60px] border-[12px] border-white shadow-2xl relative flex items-center justify-center p-12">
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 2px, transparent 2px)", backgroundSize: "30px 30px" }} />

                    <svg viewBox="0 0 100 100" className="w-full h-full max-w-2xl drop-shadow-xl">
                        {FRUITS[activeFruit].parts.map((path, pIdx) => {
                            const partId = `${activeFruit}-${pIdx}`;
                            return <path key={partId} d={path} fill={canvasState[partId] || "#F5F5F5"} stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" onClick={() => handlePaint(partId)} className="transition-colors duration-200 hover:brightness-95" />;
                        })}
                    </svg>
                </div>
            </div>

            {/* COLOR TRAY */}
            <div className="mt-10 bg-white/60 backdrop-blur-md rounded-full border-4 border-white p-6 self-center flex gap-6 shadow-2xl">
                {COLORS.map((c) => (
                    <button key={c} onClick={() => setBrushColor(c)} className={`w-14 h-14 rounded-full border-4 transition-all ${brushColor === c ? "border-white scale-125 shadow-xl rotate-12" : "border-transparent"}`} style={{ backgroundColor: c }} />
                ))}
            </div>
        </div>
    );
}
