"use client";

import Link from "next/link";
import { trackClick } from "@/lib/useVisitorTrack";

type Game = {
	slug: string;
	name: string;
	letter: string;
	hue: number;
};

export default function GamesGrid({ games }: { games: Game[] }) {
	return (
		<div className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-6">
			{games.map((game) => (
				<Link
					key={game.slug}
					href={`/${game.slug}`}
					onClick={() => trackClick(`game-${game.slug}`)}
					className="group"
				>
					<div
						className="
							relative aspect-square
							flex flex-col items-center justify-center
							border-4 border-black
							transition-transform duration-200
							group-hover:scale-[1.06]
						"
						style={{
							backgroundColor: `hsl(${game.hue}, 100%, 50%)`,
						}}
					>
						{/* Big initial */}
						<div
							className="
								font-black text-black leading-none
								text-4xl sm:text-5xl md:text-6xl
							"
						>
							{game.letter}
						</div>

						{/* Name */}
						<div
							className="
								absolute bottom-1 sm:bottom-2
								px-1
								w-full truncate text-center
								text-[9px] sm:text-[10px]
								font-semibold text-black
							"
						>
							{game.name}
						</div>
					</div>
				</Link>
			))}
		</div>
	);
}
