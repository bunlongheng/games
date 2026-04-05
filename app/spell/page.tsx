"use client";
import { usePageMeta } from "@/lib/usePageMeta";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

/* ================= DATA ================= */

type Category = {
    id: string;
    title: string;
    words: string[];
};

const CATEGORIES: Category[] = [
    { id: "colors", title: "🎨 Colors", words: ["RED", "BLUE", "GREEN", "BLACK", "WHITE"] },
    { id: "animals", title: "🐶 Animals", words: ["DOG", "CAT", "COW", "PIG", "FOX"] },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/* ================= MAIN ================= */

export default function SpellGame() {
    usePageMeta({
        title: "spell - Games",
        description: "spell",
    });
    const [category, setCategory] = useState<Category | null>(null);

    return <div className="h-screen w-screen bg-black text-white overflow-hidden">{!category ? <CategoryMenu onSelect={setCategory} /> : <Quiz category={category} goHome={() => setCategory(null)} />}</div>;
}

/* ================= CATEGORY MENU ================= */

function CategoryMenu({ onSelect }: { onSelect: (c: Category) => void }) {
    return (
        <div className="h-full grid grid-rows-[56px_1fr]">
            <Header title="Choose a Quiz" showHome={false} />

            <div className="grid grid-cols-2 gap-4 p-6 place-content-center">
                {CATEGORIES.map((c) => (
                    <button key={c.id} onClick={() => onSelect(c)} className="h-24 border border-white/20 text-lg">
                        {c.title}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ================= QUIZ ================= */

function Quiz({ category, goHome }: { category: Category; goHome: () => void }) {
    const [index, setIndex] = useState(0);
    const [typed, setTyped] = useState("");
    const [wiggleKey, setWiggleKey] = useState<string | null>(null);
    const [goodKey, setGoodKey] = useState<string | null>(null);

    // ✅ FIXED: ref must be initialized
    const timer = useRef<number | null>(null);

    const word = category.words[index];

    useEffect(() => {
        if (typed === word) {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
            });
            setTimeout(nextWord, 700);
        }
    }, [typed, word]);

    const nextWord = () => {
        setTyped("");
        setIndex((i) => (i + 1) % category.words.length);
    };

    const press = (letter: string) => {
        if (typed.length >= word.length) return;

        const expected = word[typed.length];

        if (letter === expected) {
            setTyped((v) => v + letter);
            setGoodKey(letter);

            if (timer.current) window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setGoodKey(null), 2000);
        } else {
            setWiggleKey(letter);
            setTimeout(() => setWiggleKey(null), 250);
        }
    };

    return (
        <div className="h-full grid grid-rows-[56px_1fr_160px]">
            <Header title={category.title} showHome onHome={goHome} />

            {/* WORD AREA */}
            <div className="flex items-center justify-center">
                <div className="text-[clamp(32px,6vw,64px)] tracking-[0.35em]">
                    {word.split("").map((_, i) => (
                        <span key={i} className={typed[i] ? "text-white" : "opacity-20"}>
                            {typed[i] ?? "_"}
                        </span>
                    ))}
                </div>
            </div>

            {/* KEYBOARD */}
            <Keyboard press={press} wiggleKey={wiggleKey} goodKey={goodKey} />
        </div>
    );
}

/* ================= HEADER ================= */

function Header({ title, showHome, onHome }: { title: string; showHome: boolean; onHome?: () => void }) {
    return (
        <div className="h-14 flex items-center px-4 border-b border-white/10">
            {showHome ? (
                <button onClick={onHome} className="text-sm opacity-70">
                    ← Home
                </button>
            ) : (
                <div />
            )}
            <div className="mx-auto text-sm">{title}</div>
            <div className="w-12" />
        </div>
    );
}

/* ================= KEYBOARD ================= */

function Keyboard({ press, wiggleKey, goodKey }: { press: (l: string) => void; wiggleKey: string | null; goodKey: string | null }) {
    return (
        <div className="border-t border-white/10">
            <div className="grid grid-cols-13">
                {ALPHABET.slice(0, 13).map((l) => (
                    <Key key={l} l={l} press={press} wiggle={wiggleKey === l} good={goodKey === l} />
                ))}
            </div>
            <div className="grid grid-cols-13">
                {ALPHABET.slice(13).map((l) => (
                    <Key key={l} l={l} press={press} wiggle={wiggleKey === l} good={goodKey === l} />
                ))}
            </div>

            <style jsx>{`
                .grid-cols-13 {
                    grid-template-columns: repeat(13, minmax(0, 1fr));
                }
            `}</style>
        </div>
    );
}

function Key({ l, press, wiggle, good }: { l: string; press: (l: string) => void; wiggle: boolean; good: boolean }) {
    return (
        <button onClick={() => press(l)} className={["h-20 border border-white/10 text-xl", wiggle && "animate-shake", good && "ring-4 ring-green-400"].filter(Boolean).join(" ")}>
            {l}

            <style jsx>{`
                @keyframes shake {
                    0% {
                        transform: translateX(0);
                    }
                    25% {
                        transform: translateX(-4px);
                    }
                    50% {
                        transform: translateX(4px);
                    }
                    75% {
                        transform: translateX(-4px);
                    }
                    100% {
                        transform: translateX(0);
                    }
                }
                .animate-shake {
                    animation: shake 0.25s linear;
                }
            `}</style>
        </button>
    );
}
