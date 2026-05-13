"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { STATES, StateData } from "./data";
import { usePageMeta } from "@/lib/usePageMeta";
import styles from "./styles.module.css";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Ordered geographically left → right on the US map
// Colors chosen from distinct segments of the 12-step color wheel — no duplicates
const REGION_COLORS: Record<string, string> = {
  Pacific:          "#06b6d4", // cyan        — ocean/AK/HI
  West:             "#16a085", // teal        — left coast
  "Mountain West":  "#7c3aed", // violet      — Rockies
  Midwest:          "#65a30d", // lime-green  — plains/great lakes
  South:            "#d97706", // amber       — south-central
  Southwest:        "#dc2626", // red         — TX/OK/desert
  Southeast:        "#ea580c", // orange      — SE coast
  Northeast:        "#2563eb", // blue        — NE coast
};

// Legend displayed in left-to-right geographic order
const LEGEND_ORDER = ["Pacific", "West", "Mountain West", "Midwest", "South", "Southwest", "Southeast", "Northeast"] as const;

function invertHex(hex: string): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = 255 - (num >> 16);
  const g = 255 - ((num >> 8) & 0xff);
  const b = 255 - (num & 0xff);
  return `rgb(${r},${g},${b})`;
}

function lighten(hex: string, amount = 40): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getOptions(correct: StateData, all: StateData[]): StateData[] {
  const wrong = shuffle(all.filter((s) => s.id !== correct.id)).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

export default function StatesGame() {
  usePageMeta({
    title: "states - Games",
    description: "Interactive US States educational game — study and quiz yourself on all 50 states.",
    faviconLetter: "S",
  });

  const [mode, setMode] = useState<"study" | "quiz">("study");
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [soundOn, setSoundOn] = useState(true);
  const [timerOn, setTimerOn] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Filtered states based on difficulty (cumulative: level includes all easier levels)
  const quizStates = STATES.filter((s) => s.difficulty <= difficulty);
  const totalQuestions = quizStates.length;

  // Quiz state
  const [quizQueue, setQuizQueue] = useState<StateData[]>([]);
  const [currentQ, setCurrentQ] = useState<StateData | null>(null);
  const [quizType, setQuizType] = useState<"nameIt" | "findIt">("nameIt");
  const [options, setOptions] = useState<StateData[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizHighlight, setQuizHighlight] = useState<string | null>(null);
  const [wrongAnswer, setWrongAnswer] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getTimerSeconds = useCallback(() => {
    const timers: Record<number, number> = { 1: 30, 2: 20, 3: 10, 4: 5, 5: 3 };
    return timers[difficulty] ?? 10;
  }, [difficulty]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playSuccess = useCallback(() => {
    try {
      const ctx = getAudioCtx();
      [523, 659, 784].forEach((freq, i) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.4, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }, i * 150);
      });
    } catch { /* audio not supported */ }
  }, [getAudioCtx]);

  const playWrong = useCallback(() => {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 180;
      osc.type = "sawtooth";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* audio not supported */ }
  }, [getAudioCtx]);

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTimeLeft(null);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if (!timerOn) return;
    const secs = getTimerSeconds();
    setTimeLeft(secs);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerOn, getTimerSeconds, stopTimer]);

  const loadQuestion = useCallback((queue: StateData[]) => {
    if (queue.length === 0) {
      setQuizDone(true);
      stopTimer();
      confetti({ particleCount: 200, spread: 160, origin: { x: 0.5, y: 0.3 } });
      return;
    }
    const [next, ...rest] = queue;
    setQuizQueue(rest);
    setCurrentQ(next);
    const type: "nameIt" | "findIt" = Math.random() < 0.5 ? "nameIt" : "findIt";
    setQuizType(type);
    setOptions(getOptions(next, quizStates));
    setQuizHighlight(type === "nameIt" ? next.id : null);
  }, [quizStates, stopTimer]);

  const startQuiz = useCallback(() => {
    setScore({ correct: 0, total: 0 });
    setQuizDone(false);
    setWrongAnswer(null);
    setCorrectAnswer(null);
    setQuizHighlight(null);
    setIsAnswering(false);
    loadQuestion(shuffle(quizStates));
  }, [loadQuestion, quizStates]);

  useEffect(() => {
    if (mode === "quiz" && !currentQ && !quizDone) startQuiz();
  }, [mode, currentQ, quizDone, startQuiz]);

  const advanceQuiz = useCallback(() => {
    setCorrectAnswer(null);
    setWrongAnswer(null);
    setQuizHighlight(null);
    loadQuestion(quizQueue);
  }, [quizQueue, loadQuestion]);

  const handleAnswer = useCallback((chosen: StateData) => {
    if (isAnswering || !currentQ) return;
    setIsAnswering(true);
    if (chosen.id === currentQ.id) {
      setCorrectAnswer(chosen.id);
      setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
      if (soundOn) playSuccess();
      confetti({ particleCount: 80, spread: 60, origin: { x: 0.85, y: 0.5 } });
      setTimeout(() => { advanceQuiz(); setIsAnswering(false); }, 1500);
    } else {
      setWrongAnswer(chosen.id);
      setScore((s) => ({ ...s, total: s.total + 1 }));
      if (soundOn) playWrong();
      setTimeout(() => { advanceQuiz(); setIsAnswering(false); }, 1200);
    }
  }, [isAnswering, currentQ, playSuccess, playWrong, advanceQuiz, soundOn]);

  // Start timer when a new question loads
  useEffect(() => {
    if (mode === "quiz" && currentQ && !quizDone && !isAnswering) startTimer();
    return () => stopTimer();
  }, [currentQ, mode, quizDone, isAnswering, startTimer, stopTimer]);

  // Handle timeout - auto-skip as wrong
  useEffect(() => {
    if (timeLeft === 0 && !isAnswering && currentQ) {
      setIsAnswering(true);
      setScore((s) => ({ ...s, total: s.total + 1 }));
      if (soundOn) playWrong();
      setTimeout(() => { advanceQuiz(); setIsAnswering(false); }, 1000);
    }
  }, [timeLeft, isAnswering, currentQ, soundOn, playWrong, advanceQuiz]);

  const handleStateClick = useCallback((state: StateData) => {
    if (mode === "study") {
      setSelectedState(state);
    } else if (mode === "quiz" && quizType === "findIt" && currentQ) {
      handleAnswer(state);
    }
  }, [mode, quizType, currentQ, handleAnswer]);

  const switchMode = (newMode: "study" | "quiz") => {
    setMode(newMode);
    setSelectedState(null);
    if (newMode === "quiz") { setCurrentQ(null); setQuizDone(false); }
  };

  const progressPct = Math.round((score.total / totalQuestions) * 100);

  // Build fipsCode → StateData lookup
  const stateByFips = Object.fromEntries(STATES.map((s) => [s.fipsCode, s]));

  const getStateFill = (stateData: StateData | undefined, isHighlight: boolean, isWrong: boolean, isCorrect: boolean, isSelected: boolean, isHovered: boolean, isRegionHovered: boolean) => {
    if (isCorrect) return "#22c55e";
    if (isWrong) return "#ef4444";
    if (isHighlight) return "#fbbf24";
    const base = REGION_COLORS[stateData?.region ?? ""] ?? "#888";
    if (isSelected) return lighten(base, 60);
    if (isHovered) return lighten(base, 45);
    if (isRegionHovered) return lighten(base, 30);
    return base;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>States</h1>
        <div className={styles.headerRight}>
          <div className={styles.modeToggle}>
            <button className={`${styles.modeBtn} ${mode === "study" ? styles.modeBtnActive : ""}`} onClick={() => switchMode("study")}>📖 Study</button>
            <button className={`${styles.modeBtn} ${mode === "quiz" ? styles.modeBtnActive : ""}`} onClick={() => switchMode("quiz")}>🎯 Quiz</button>
          </div>
          <button className={styles.configBtn} onClick={() => setShowConfig(true)}>
            <span className={styles.configIcon}>⚙</span> Settings
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Map + panel layout */}
        <div className={`${styles.mapLayout} ${selectedState && mode === "study" ? styles.mapLayoutWithPanel : ""}`}>
          <div className={styles.mapContainer} onClick={() => mode === "study" && setSelectedState(null)}>
            <ComposableMap
              projection="geoAlbersUsa"
              className={styles.map}
              projectionConfig={{ scale: 900 }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: { id: string; rsmKey: string; [key: string]: unknown }[] }) =>
                  geographies.map((geo) => {
                    // us-atlas stores FIPS as a padded string in geo.id
                    const fips = String(geo.id).padStart(2, "0");
                    const stateData = stateByFips[fips];
                    const id = stateData?.id ?? "";
                    const isHighlight = quizHighlight === id;
                    const isWrong = wrongAnswer === id;
                    const isCorrect = correctAnswer === id;
                    const isSelected = selectedState?.id === id;
                    const isHovered = hoveredState === id;
                    const isRegionHovered = !!hoveredRegion && stateData?.region === hoveredRegion;
                    const fill = getStateFill(stateData, isHighlight, isWrong, isCorrect, isSelected, isHovered, isRegionHovered);
                    const isQuizFindIt = mode === "quiz" && quizType === "findIt";
                    const stroke = isSelected ? "#ffffff"
                      : isRegionHovered ? "#ffffff"
                      : "#1a1a2e";
                    const strokeWidth = isSelected ? 2.5 : isRegionHovered ? 1.5 : 0.5;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); stateData && handleStateClick(stateData); }}
                        onMouseEnter={() => stateData && setHoveredState(stateData.id)}
                        onMouseLeave={() => setHoveredState(null)}
                        className={[
                          styles.statePath,
                          isHighlight ? styles.quizHighlight : "",
                          isWrong ? styles.wrongAnswer : "",
                          isCorrect ? styles.correctAnswer : "",
                          isSelected ? styles.selected : "",
                          isRegionHovered ? styles.regionHovered : "",
                          isQuizFindIt ? styles.findItHover : "",
                        ].filter(Boolean).join(" ")}
                        style={{
                          default: { fill, stroke, strokeWidth, outline: "none", cursor: "pointer", transition: "fill 0.15s" },
                          hover:   { fill, stroke: "#ffffff", strokeWidth: 1.2, outline: "none", cursor: "pointer" },
                          pressed: { fill, outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {/* State abbreviation labels - hidden at difficulty 3+ during quiz */}
              {!(mode === "quiz" && difficulty >= 3) && STATES.map((state) => {
                // Skip tiny states that would be too cluttered (RI, DE, CT, NJ, MD, MA, VT, NH)
                const skipLabel = ["rhode-island", "delaware", "connecticut", "new-jersey", "maryland", "massachusetts", "vermont", "new-hampshire", "district-of-columbia"].includes(state.id);
                if (skipLabel) return null;
                return (
                  <Marker key={state.id} coordinates={[state.centerLon, state.centerLat]}>
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={styles.stateLabel}
                      style={{ pointerEvents: "none" }}
                    >
                      {state.abbreviation}
                    </text>
                  </Marker>
                );
              })}
            </ComposableMap>
            {mode === "study" && (
              <div className={styles.legendOverlay}>
                {LEGEND_ORDER.map((region) => (
                  <div
                    key={region}
                    className={`${styles.legendItem} ${hoveredRegion === region ? styles.legendItemActive : ""} ${selectedState?.region === region ? styles.legendItemSelected : ""}`}
                    style={selectedState?.region === region ? { "--legend-glow": REGION_COLORS[region] } as React.CSSProperties : undefined}
                    onMouseEnter={() => setHoveredRegion(region)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <span className={styles.legendDot} style={{ background: REGION_COLORS[region] }} />
                    <span className={styles.legendLabel}>{region}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Study info panel */}
          {mode === "study" && (
            <div
              className={`${styles.infoPanel} ${selectedState ? styles.infoPanelOpen : ""}`}
              style={selectedState ? {
                "--region-color": REGION_COLORS[selectedState.region] ?? "#888",
                "--region-color-inverted": invertHex(REGION_COLORS[selectedState.region] ?? "#888888"),
              } as React.CSSProperties : undefined}
            >
              {selectedState ? (
                <>
                  <button className={styles.closeBtn} onClick={() => setSelectedState(null)} aria-label="Close panel">✕</button>
                  <div className={styles.regionBadge}>
                    <span className={styles.regionDot} />
                    <span>{selectedState.region}</span>
                  </div>
                  <h2 className={styles.stateNameLarge}>{selectedState.name}</h2>
                  <p className={styles.statePronunciation}>{selectedState.pronunciation}</p>
                  <button className={styles.speakBtn} onClick={() => speak(`${selectedState.name}. ${selectedState.pronunciation}`)}>🔊 Pronounce</button>

                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>🏛️ Capital</span>
                      <span className={styles.infoValue}>{selectedState.capital}<span className={styles.infoPop}> ({selectedState.capitalPop})</span></span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>📅 Union</span>
                      <span className={styles.infoValue}>#{selectedState.unionOrder} - {selectedState.unionDate}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>🗺️ Region</span>
                      <span className={styles.infoValue}>{selectedState.region}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>📐 Area</span>
                      <span className={styles.infoValue}>{selectedState.areaSqMiles}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>🐦 State Bird</span>
                      <span className={styles.infoValue}>{selectedState.stateBird}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>🌸 State Flower</span>
                      <span className={styles.infoValue}>{selectedState.stateFlower}</span>
                    </div>
                    <div className={`${styles.infoItem} ${styles.infoItemFull}`}>
                      <span className={styles.infoLabel}>📜 Motto</span>
                      <span className={styles.infoValue}>{selectedState.stateMotto}</span>
                    </div>
                  </div>

                  <div className={styles.funFacts}>
                    <h3 className={styles.funFactsTitle}>🌟 Fun Facts</h3>
                    {selectedState.funFacts.map((fact, i) => (
                      <p key={i} className={styles.funFact}>⭐ {fact}</p>
                    ))}
                  </div>
                </>
              ) : (
                <div className={styles.infoPanelPlaceholder}>
                  <div className={styles.placeholderIcon}>🗺️</div>
                  <p>Click any state to learn about it!</p>
                </div>
              )}
            </div>
          )}

          {/* Quiz sidebar with progress + question + options */}
          {mode === "quiz" && !quizDone && currentQ && (
            <div className={styles.quizSidebar}>
              <div className={styles.quizHeader}>
                <div className={styles.quizHeaderRow}>
                  <div className={styles.scoreDisplay}>⭐ {score.correct} / {totalQuestions}</div>
                  {timerOn && timeLeft !== null && (
                    <div className={`${styles.timerDisplay} ${timeLeft <= 3 ? styles.timerCritical : ""}`}>
                      {timeLeft}s
                    </div>
                  )}
                </div>
                <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progressPct}%` }} /></div>
                <div className={styles.progressLabel}>{score.total} answered</div>
              </div>

              <div className={styles.quizQuestion}>
                {quizType === "findIt"
                  ? <span>🗺️ Find <strong>{currentQ.name}</strong> on the map!</span>
                  : <span>❓ What state is highlighted?</span>}
              </div>

              {quizType === "nameIt" ? (
                <div className={styles.quizOptionsStack}>
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      className={`${styles.optionBtn} ${wrongAnswer === opt.id ? styles.optionBtnWrong : ""} ${correctAnswer === opt.id ? styles.optionBtnCorrect : ""}`}
                      onClick={() => handleAnswer(opt)}
                      disabled={isAnswering}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.findItHint}><span>👆 Click the state on the map</span></div>
              )}
            </div>
          )}
        </div>

        {/* Victory screen */}
        {mode === "quiz" && quizDone && (
          <div className={styles.victoryScreen}>
            <div className={styles.victoryCard}>
              <div className={styles.victoryEmoji}>🎉</div>
              <h2 className={styles.victoryTitle}>AMAZING!</h2>
              <p className={styles.victorySubtitle}>You finished all 50 states!</p>
              <div className={styles.finalScore}>
                <span className={styles.finalScoreNum}>{score.correct}</span>
                <span className={styles.finalScoreDen}> / {totalQuestions}</span>
                <p className={styles.finalScoreLabel}>
                  {score.correct === totalQuestions ? "Perfect score! 🏆" : score.correct >= totalQuestions * 0.8 ? "Excellent! 🌟" : score.correct >= totalQuestions * 0.6 ? "Great job! 👏" : "Keep practicing! 💪"}
                </p>
              </div>
              <button className={styles.restartBtn} onClick={() => { setCurrentQ(null); setQuizDone(false); startQuiz(); }}>🔄 Play Again</button>
              <button className={styles.studyModeBtn} onClick={() => switchMode("study")}>📖 Study Mode</button>
            </div>
          </div>
        )}
      </main>


      {/* Settings modal */}
      {showConfig && (
        <div className={styles.modalOverlay} onClick={() => setShowConfig(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>SETTINGS</h2>
              <button className={styles.modalClose} onClick={() => setShowConfig(false)}>✕</button>
            </div>
            <div className={styles.modalDivider} />
            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>DIFFICULTY</div>
              <div className={styles.modalTiles}>
                {([1, 2, 3, 4, 5] as const).map((level) => (
                  <button
                    key={level}
                    className={`${styles.modalTile} ${difficulty === level ? styles.modalTileActive : ""}`}
                    onClick={() => setDifficulty(level)}
                  >
                    {level}⭐
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.modalSection}>
              <div className={styles.modalSectionTitle}>OPTIONS</div>
              <div className={styles.modalToggles}>
                <button
                  className={`${styles.modalToggle} ${soundOn ? styles.modalToggleActive : ""}`}
                  onClick={() => setSoundOn(!soundOn)}
                >
                  {soundOn ? "🔊" : "🔇"} Sound
                </button>
                <button
                  className={`${styles.modalToggle} ${timerOn ? styles.modalToggleActive : ""}`}
                  onClick={() => setTimerOn(!timerOn)}
                >
                  {timerOn ? "⏱️" : "⏱️"} Timer {timerOn && <span className={styles.timerDetail}>({getTimerSeconds()}s)</span>}
                </button>
              </div>
            </div>
            <button
              className={styles.modalSaveBtn}
              onClick={() => { setShowConfig(false); if (mode === "quiz") { setCurrentQ(null); setQuizDone(false); } }}
            >
              SAVE & CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
