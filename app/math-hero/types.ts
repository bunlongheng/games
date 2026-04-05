// types.ts - TypeScript interfaces for Math Heroes

export interface Hero {
    id: string;
    name: string;
    title: string;
    color: string;
    gradient: string;
    element: string;
    item: string;
    description: string;
    abilities?: string[];
    weapon?: {
        name: string;
        type: string;
        description: string;
    };
    vehicle?: {
        name: string;
        type: string;
        color: string;
        features: string;
    };
    stats?: {
        power: number;
        speed: number;
        defense: number;
        intelligence: number;
    };
    image: string;
}

export interface GameState {
    selectedCharacter: string | null;
    currentQuestion: number;
    totalQuestions: number;
    correctAnswers: number;
    treasures: number;
    playerName: string;
    operation: "addition" | "subtraction" | "multiplication" | "division";
    difficulty: 1 | 2 | 3 | 4 | 5;
    timePerQuestion: number;
    timerInterval: NodeJS.Timeout | null;
    timeRemaining: number;
}

export interface Question {
    question: string;
    answer: number;
    options: number[];
}

export interface HeroesData {
    heroes: Hero[];
    metadata: {
        version: string;
        total_heroes: number;
        last_updated: string;
        game: string;
    };
}
