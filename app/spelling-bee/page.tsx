"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import quizData from "./quiz-data.json";

const palette12 = [
	"#FF3B30",
	"#FF6B4E",
	"#FF9500",
	"#FFCC00",
	"#D4E157",
	"#34C759",
	"#00C7BE",
	"#32ADE6",
	"#007AFF",
	"#5856D6",
	"#AF52DE",
	"#FF2D55",
];

const successMessages = [
	"Amazing, Norden! 🌟",
	"Perfect spelling! 🎉",
	"You're a star! ⭐",
	"Fantastic job! 🚀",
	"Incredible! 🏆",
];

const SpellingQuiz = () => {
	const [screen, setScreen] = useState<"home" | "quiz" | "results">("home");
	const [selectedCategory, setSelectedCategory] = useState<any>(null);
	const [currentWordIndex, setCurrentWordIndex] = useState(0);
	const [userAnswer, setUserAnswer] = useState("");
	const [score, setScore] = useState(0);
	const [disabledKeys, setDisabledKeys] = useState<Set<string>>(new Set());
	const [showSuccess, setShowSuccess] = useState(false);
	const [flashGreenKey, setFlashGreenKey] = useState<string | null>(null);
	const [wiggleKey, setWiggleKey] = useState<string | null>(null);

	const keyboard = [
		["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
		["N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
	];

	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			window.speechSynthesis.cancel();
			document.body.style.overflow = "auto";
		};
	}, []);

	const speakWord = (word: string, hint: string) => {
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(`Spell ${word}. ${hint}`);
		utterance.rate = 0.8;
		utterance.pitch = 1;
		utterance.volume = 1;
		window.speechSynthesis.speak(utterance);
	};

	const startQuiz = (category: any) => {
		setSelectedCategory(category);
		setScreen("quiz");
		setCurrentWordIndex(0);
		setUserAnswer("");
		setScore(0);
		setDisabledKeys(new Set());
		setFlashGreenKey(null);
		setWiggleKey(null);

		setTimeout(() => {
			speakWord(category.words[0].word, category.words[0].hint);
		}, 500);
	};

	const goHome = () => {
		window.speechSynthesis.cancel();
		setScreen("home");
		setSelectedCategory(null);
		setCurrentWordIndex(0);
		setUserAnswer("");
		setScore(0);
		setDisabledKeys(new Set());
		setFlashGreenKey(null);
		setWiggleKey(null);
		setShowSuccess(false);
	};

	const handleKeyPress = (letter: string) => {
		if (disabledKeys.has(letter) || showSuccess) return;

		const currentWord = selectedCategory.words[currentWordIndex];
		const nextPosition = userAnswer.length;
		const correctLetter = currentWord.word[nextPosition]?.toUpperCase();

		if (letter === correctLetter) {
			setFlashGreenKey(letter);
			const newAnswer = userAnswer + letter;
			setUserAnswer(newAnswer);

			setTimeout(() => {
				setFlashGreenKey(null);
				setDisabledKeys(new Set());
			}, 300);

			if (newAnswer.toUpperCase() === currentWord.word.toUpperCase()) {
				handleCorrectWord();
			}
		} else {
			setWiggleKey(letter);
			setDisabledKeys((prev) => new Set([...prev, letter]));

			setTimeout(() => {
				setWiggleKey(null);
			}, 500);
		}
	};

	const handleCorrectWord = () => {
		setShowSuccess(true);
		setScore(score + 10);

		confetti({
			particleCount: 100,
			spread: 70,
			origin: { y: 0.6 },
			colors: palette12,
		});

		setTimeout(() => {
			setShowSuccess(false);

			if (currentWordIndex < 9) {
				const nextIndex = currentWordIndex + 1;
				setCurrentWordIndex(nextIndex);
				setUserAnswer("");
				setDisabledKeys(new Set());
				setFlashGreenKey(null);
				setWiggleKey(null);

				setTimeout(() => {
					const nextWord = selectedCategory.words[nextIndex];
					speakWord(nextWord.word, nextWord.hint);
				}, 300);
			} else {
				setScreen("results");
			}
		}, 2000);
	};

	const handleReplayWord = () => {
		const currentWord = selectedCategory.words[currentWordIndex];
		speakWord(currentWord.word, currentWord.hint);
	};

	if (screen === "home") {
		return (
			<div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
				<div className="w-full max-w-6xl">
					<div className="text-center mb-6">
						<h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
							🌟 Norden's Spelling Adventure! 🌟
						</h1>
						<p className="text-lg md:text-2xl text-gray-300">
							Choose a category to begin!
						</p>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
						{quizData.categories.map((category) => (
							<button
								key={category.id}
								onClick={() => startQuiz(category)}
								className="bg-gray-800 rounded-2xl p-4 md:p-6 hover:scale-105 transition-all duration-300 border-4 border-transparent hover:border-current"
								style={{ color: category.color }}
							>
								<div className="text-4xl md:text-6xl mb-2">{category.emoji}</div>
								<h3 className="text-lg md:text-2xl font-bold text-white mb-1">
									{category.name}
								</h3>
								<p className="text-xs md:text-sm text-gray-400">10 words</p>
							</button>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (screen === "results") {
		const isPassing = score >= 50;

		return (
			<div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
				<div className="max-w-2xl w-full text-center">
					<div className="text-6xl md:text-9xl mb-4">{isPassing ? "🏆" : "⭐"}</div>

					{isPassing ? (
						<>
							<h1 className="text-3xl md:text-5xl font-bold text-white mb-2 md:mb-4">
								🏆 Congratulations, Norden! 🎉
							</h1>
							<p
								className="text-2xl md:text-3xl font-bold mb-4 md:mb-6"
								style={{ color: selectedCategory.color }}
							>
								You're a {selectedCategory.name} Champion!
							</p>
						</>
					) : (
						<>
							<h1 className="text-3xl md:text-5xl font-bold text-white mb-2 md:mb-4">
								Keep Trying, Norden! 💪
							</h1>
							<p className="text-xl md:text-2xl text-gray-300 mb-4 md:mb-6">
								You're doing great! Practice makes perfect!
							</p>
						</>
					)}

					<div
						className="bg-gray-800 rounded-2xl p-6 md:p-8 mb-6 md:mb-8 border-4"
						style={{ borderColor: selectedCategory.color }}
					>
						<p className="text-4xl md:text-6xl font-bold text-white mb-2">{score}</p>
						<p className="text-xl md:text-2xl text-gray-300">out of 100 points</p>
						<p className="text-lg md:text-xl text-gray-400 mt-2 md:mt-4">
							{score / 10} correct out of 10 words
						</p>
					</div>

					<div className="flex gap-3 md:gap-4 justify-center flex-wrap">
						<button
							onClick={() => startQuiz(selectedCategory)}
							className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg md:text-xl font-bold rounded-xl hover:scale-105 transition-all duration-300"
						>
							🔄 Try Again
						</button>
						<button
							onClick={goHome}
							className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg md:text-xl font-bold rounded-xl hover:scale-105 transition-all duration-300"
						>
							🏠 Choose New Category
						</button>
					</div>
				</div>
			</div>
		);
	}

	const currentWord = selectedCategory.words[currentWordIndex];
	const progress = ((currentWordIndex + 1) / 10) * 100;

	return (
		<div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col p-2 md:p-4">
			<div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0">
				{/* Header */}
				<div className="mb-2 flex-shrink-0">
					<div className="flex items-center justify-between mb-2">
						<h2 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2">
							{selectedCategory.emoji} {selectedCategory.name}
						</h2>
						<div className="flex items-center gap-2">
							<button
								onClick={goHome}
								className="px-3 md:px-4 py-2 bg-gray-700 text-white text-sm md:text-base font-bold rounded-lg hover:scale-105 transition-all duration-300"
							>
								🏠 Home
							</button>
							<div className="text-lg md:text-2xl font-bold text-white bg-gray-800 px-3 md:px-6 py-2 md:py-3 rounded-xl">
								Score: {score}
							</div>
						</div>
					</div>

					<div className="bg-gray-700 rounded-full h-3 md:h-4 overflow-hidden">
						<div
							className="h-full transition-all duration-500 rounded-full"
							style={{
								width: `${progress}%`,
								backgroundColor: selectedCategory.color,
							}}
						/>
					</div>
					<p className="text-center text-gray-400 mt-1 text-sm md:text-base">
						Word {currentWordIndex + 1} of 10
					</p>
				</div>

				{/* Success Alert */}
				{showSuccess && (
					<div
						className="mb-2 p-3 md:p-4 rounded-2xl text-center animate-bounce border-4 flex-shrink-0"
						style={{
							backgroundColor: "#34C75933",
							borderColor: "#34C759",
						}}
					>
						<p className="text-xl md:text-2xl font-bold text-white">
							{successMessages[Math.floor(Math.random() * successMessages.length)]}
						</p>
					</div>
				)}

				{/* Word Display - Reduced padding */}
				<div
					className="bg-gray-800 rounded-2xl p-3 md:p-6 mb-2 text-center border-4 flex-shrink-0"
					style={{ borderColor: selectedCategory.color }}
				>
					<div className="text-5xl md:text-7xl mb-2 md:mb-4">{currentWord.image}</div>
					<p className="text-lg md:text-xl text-gray-300 mb-2 md:mb-4">
						{currentWord.hint}
					</p>

					<button
						onClick={handleReplayWord}
						className="px-4 md:px-6 py-2 bg-blue-600 text-white text-sm md:text-base font-bold rounded-xl hover:scale-105 transition-all duration-300 mb-2 md:mb-4 mx-auto"
					>
						🔊 Hear Word Again
					</button>

					<div className="flex justify-center gap-2 md:gap-3">
						{currentWord.word.split("").map((_: string, index: number) => (
							<div
								key={index}
								className="w-10 h-12 md:w-14 md:h-16 bg-gray-700 rounded-xl flex items-center justify-center text-2xl md:text-3xl font-bold text-white border-2 md:border-4"
								style={{
									borderColor: userAnswer[index] ? "#34C759" : "#4B5563",
								}}
							>
								{userAnswer[index]?.toUpperCase() || ""}
							</div>
						))}
					</div>
				</div>

				{/* Keyboard - Pushed up closer */}
				<div className="space-y-1 md:space-y-2 flex-shrink-0">
					{keyboard.map((row, rowIndex) => (
						<div key={rowIndex} className="flex justify-center gap-1 md:gap-2">
							{row.map((letter) => {
								const isDisabled = disabledKeys.has(letter);
								const isFlashingGreen = flashGreenKey === letter;
								const isWiggling = wiggleKey === letter;

								return (
									<button
										key={letter}
										onClick={() => handleKeyPress(letter)}
										disabled={isDisabled || showSuccess}
										className={`
                      w-10 h-10 md:w-14 md:h-14 text-lg md:text-xl font-bold rounded-xl transition-all duration-200
                      ${isDisabled ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-white text-gray-900 hover:scale-110"}
                      ${isWiggling ? "animate-wiggle" : ""}
                      ${showSuccess ? "cursor-not-allowed" : ""}
                    `}
										style={
											isFlashingGreen
												? {
														backgroundColor: "#34C759",
														color: "white",
														border: "4px solid #34C759",
													}
												: {}
										}
									>
										{letter}
									</button>
								);
							})}
						</div>
					))}
				</div>
			</div>

			<style jsx>{`
				@keyframes wiggle {
					0%,
					100% {
						transform: translateX(0);
					}
					25% {
						transform: translateX(-10px);
					}
					75% {
						transform: translateX(10px);
					}
				}
				.animate-wiggle {
					animation: wiggle 0.3s ease-in-out;
				}
			`}</style>
		</div>
	);
};

export default SpellingQuiz;
