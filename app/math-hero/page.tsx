"use client";
import { usePageMeta } from "@/lib/usePageMeta";

import { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import styles from "./styles.module.css";
import heroesDataJson from "./data.json";
import type { Hero, GameState, Question } from "./types";
// Integrated Lucide Icons
import { Settings, Home, Trophy, X, RotateCcw } from "lucide-react";

export default function MathHeroesGame() {
    usePageMeta({
        title: "math hero - Games",
        description: "math hero",
    });
    const heroesData: Hero[] = heroesDataJson.heroes;

    const [gameState, setGameState] = useState<GameState>({
        selectedCharacter: null,
        currentQuestion: 0,
        totalQuestions: 10,
        correctAnswers: 0,
        treasures: 0,
        playerName: "Player",
        operation: "addition",
        difficulty: 1,
        timePerQuestion: 30,
        timerInterval: null,
        timeRemaining: 30,
    });

    const [currentScreen, setCurrentScreen] = useState<"selection" | "game" | "completion">("selection");
    const [showSettings, setShowSettings] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [selectedHero, setSelectedHero] = useState<Hero | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameState((prev) => ({ ...prev, timeRemaining: 30 }));

        timerRef.current = setInterval(() => {
            setGameState((prev) => {
                if (prev.timeRemaining <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    // Handle time out - move to next or play fail sound
                    return { ...prev, timeRemaining: 0 };
                }
                return { ...prev, timeRemaining: prev.timeRemaining - 1 };
            });
        }, 1000);
    }, []);

    const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.3) => {
        if (!audioContextRef.current) return;
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + duration);
    }, []);

    const fireConfetti = useCallback(
        (isFinal = false) => {
            const heroColor = selectedHero?.color || "#00d9ff";
            if (isFinal) {
                const colors = [heroColor, "#ffffff", "#ffd700"];
                let count = 0;
                const burst = () => {
                    confetti({ particleCount: 120, spread: 160, origin: { x: 0.2, y: 0.5 }, colors });
                    confetti({ particleCount: 120, spread: 160, origin: { x: 0.8, y: 0.5 }, colors });
                    confetti({ particleCount: 100, spread: 80, origin: { x: 0.5, y: 0.3 }, colors });
                    count++;
                    if (count < 5) setTimeout(burst, 600);
                };
                burst();
            } else {
                confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.6 },
                    colors: [heroColor, "#ffffff", "#ffd700"],
                });
            }
        },
        [selectedHero],
    );

    const generateQuestion = useCallback((): Question => {
        const { operation, difficulty } = gameState;
        const maxNum = [10, 20, 50, 100, 200][difficulty - 1];
        let n1 = Math.floor(Math.random() * maxNum) + 1;
        let n2 = Math.floor(Math.random() * maxNum) + 1;
        let ans = 0,
            symb = "+";

        if (operation === "addition") {
            ans = n1 + n2;
            symb = "+";
        } else if (operation === "subtraction") {
            n1 = n1 + n2;
            ans = n1 - n2;
            symb = "−";
        } else if (operation === "multiplication") {
            n1 = Math.floor(Math.random() * 10) + 1;
            n2 = Math.floor(Math.random() * 10) + 1;
            ans = n1 * n2;
            symb = "×";
        } else {
            n2 = Math.floor(Math.random() * 10) + 1;
            ans = Math.floor(Math.random() * 10) + 1;
            n1 = n2 * ans;
            symb = "÷";
        }

        const opts = [ans];
        while (opts.length < 4) {
            const w = ans + (Math.floor(Math.random() * 10) - 5);
            if (w > 0 && !opts.includes(w)) opts.push(w);
        }
        return { question: `${n1} ${symb} ${n2} = ?`, answer: ans, options: opts.sort(() => Math.random() - 0.5) };
    }, [gameState]);

    const selectHero = (hero: Hero) => {
        setSelectedHero(hero);
        document.documentElement.style.setProperty("--hero-color", hero.color);
        setCurrentQuestion(generateQuestion());
        setGameState((prev) => ({ ...prev, currentQuestion: 0, correctAnswers: 0, treasures: 0, timeRemaining: 30 }));
        setCurrentScreen("game");
        startTimer();
    };

    const checkAnswer = (selected: number) => {
        if (selected === currentQuestion?.answer) {
            playSound(800, 0.1, "sine", 0.3);
            fireConfetti();
            const nextIdx = gameState.currentQuestion + 1;
            if (nextIdx >= gameState.totalQuestions) {
                if (timerRef.current) clearInterval(timerRef.current);
                setGameState((prev) => ({ ...prev, correctAnswers: prev.correctAnswers + 1, treasures: prev.treasures + 1 }));
                setCurrentScreen("completion");
                // Victory sounds
                [0, 200, 400, 600, 800].forEach((delay, i) => {
                    setTimeout(() => playSound([523, 659, 784, 1047, 1319][i], 0.3, "sine", 0.4), delay);
                });
                fireConfetti(true);
            } else {
                setGameState((prev) => ({ ...prev, correctAnswers: prev.correctAnswers + 1, treasures: prev.treasures + 1, currentQuestion: nextIdx }));
                setCurrentQuestion(generateQuestion());
                startTimer();
            }
        } else {
            playSound(200, 0.2, "sine", 0.3);
        }
    };

    return (
        <div className={styles.container}>
            {/* --- SELECTION --- */}
            {currentScreen === "selection" && (
                <div className={styles.characterSelection}>
                    <div className={styles.headerRow}>
                        <Settings className={styles.selectionSettingsBtn} size={32} onClick={() => setShowSettings(true)} />
                    </div>
                    <div className={styles.characterGrid}>
                        {heroesData.map((hero) => (
                            <div key={hero.id} className={styles.characterCard} style={{ "--hover-color": hero.color } as any} onClick={() => selectHero(hero)}>
                                <div className={styles.characterArtwork} style={{ backgroundImage: `url('${hero.image}')` }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- GAME --- */}
            {currentScreen === "game" && selectedHero && currentQuestion && (
                <div className={styles.gameScreen}>
                    <div className={styles.topNavRow}>
                        <Home
                            className={styles.homeBtn}
                            size={30}
                            onClick={() => {
                                if (timerRef.current) clearInterval(timerRef.current);
                                setCurrentScreen("selection");
                            }}
                        />
                        <div className={styles.timerContainer}>
                            <div
                                className={styles.timerBar}
                                style={{
                                    width: `${(gameState.timeRemaining / 30) * 100}%`,
                                    // Inline color removed because CSS now uses var(--hero-color)
                                }}
                            />
                        </div>
                        <div className={styles.topNavRight}>
                            <div className={styles.treasureCounter}>
                                <span className={styles.itemIcon} style={{ filter: `drop-shadow(0 0 5px ${selectedHero.color})` }}>
                                    {selectedHero.item}
                                </span>
                                <span>{gameState.treasures}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.gameContentWrapper}>
                        <div className={styles.heroSection}>
                            <div className={styles.characterHero} style={{ backgroundImage: `url('${selectedHero.image}')` }} />
                        </div>
                        <div className={styles.questionSection}>
                            <div className={styles.questionText}>{currentQuestion.question}</div>
                        </div>
                        <div className={styles.answerSection}>
                            <div className={styles.answersGrid}>
                                {currentQuestion.options.map((opt, i) => (
                                    <button key={i} className={styles.answerBtn} style={{ "--hero-border": selectedHero.color } as any} onClick={() => checkAnswer(opt)}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- COMPLETION --- */}
            {currentScreen === "completion" && selectedHero && (
                <div className={styles.completionScreen}>
                    <div className={styles.victoryHeader}>
                        <h1 className={styles.victoryTitle} style={{ color: selectedHero.color }}>
                            VICTORY!
                        </h1>
                    </div>

                    <div className={styles.victoryHeroWrapper}>
                        <div className={styles.victoryHero} style={{ backgroundImage: `url('${selectedHero.image}')` }} />
                    </div>

                    <div className={styles.victoryStats}>
                        <div className={styles.statLine}>
                            Score:{" "}
                            <strong>
                                {gameState.correctAnswers}/{gameState.totalQuestions}
                            </strong>
                        </div>
                        <div className={styles.statLine} style={{ color: selectedHero.color }}>
                            {selectedHero.item} Treasures: <strong>{gameState.treasures}</strong>
                        </div>
                    </div>

                    <div className={styles.victoryActions}>
                        <button className={styles.playAgainBtn} onClick={() => setCurrentScreen("selection")}>
                            <RotateCcw size={24} style={{ marginRight: "10px" }} />
                            PLAY AGAIN
                        </button>
                    </div>
                </div>
            )}

            {/* --- SETTINGS MODAL --- */}
            {showSettings && (
                <div className={styles.settingsModal}>
                    <div className={styles.settingsContent}>
                        <div className={styles.settingsHeader}>
                            <h2 className={styles.settingsTitle}>SETTINGS</h2>
                            <X className={styles.closeIcon} onClick={() => setShowSettings(false)} />
                        </div>

                        <div className={styles.settingGroup}>
                            <label className={styles.settingLabel}>DIFFICULTY</label>
                            <div className={styles.optionRow}>
                                {[1, 2, 3, 4, 5].map((d) => (
                                    <button key={d} className={`${styles.configBtn} ${gameState.difficulty === d ? styles.active : ""}`} onClick={() => setGameState((p) => ({ ...p, difficulty: d as any }))}>
                                        {d}⭐
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.settingGroup}>
                            <label className={styles.settingLabel}>OPERATIONS</label>
                            <div className={styles.optionRow}>
                                {[
                                    { id: "addition", s: "+" },
                                    { id: "subtraction", s: "−" },
                                    { id: "multiplication", s: "×" },
                                    { id: "division", s: "÷" },
                                ].map((op) => (
                                    <button key={op.id} className={`${styles.configBtn} ${styles.opBtn} ${gameState.operation === op.id ? styles.active : ""}`} onClick={() => setGameState((p) => ({ ...p, operation: op.id as any }))}>
                                        {op.s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className={styles.closeBtn} onClick={() => setShowSettings(false)}>
                            SAVE & CLOSE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
