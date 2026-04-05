import fs from "fs";
import path from "path";
import GamesGrid from "./GamesGrid";

type Game = {
	slug: string;
	name: string;
	letter: string;
	hue: number;
};

function getGames(): Game[] {
	const gamesDir = path.join(process.cwd(), "app");

	const dirs = fs.readdirSync(gamesDir, { withFileTypes: true }).filter((dir) => {
		if (!dir.isDirectory()) return false;
		if (dir.name.startsWith("_")) return false;

		// Only include real App Router routes
		return fs.existsSync(path.join(gamesDir, dir.name, "page.tsx"));
	});

	const total = dirs.length || 1;

	return dirs
		.map((dir, index) => {
			const name = dir.name.replace(/-/g, " ");
			const hue = Math.round((index / total) * 360);

			return {
				slug: dir.name,
				name,
				letter: name[0].toUpperCase(),
				hue,
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name));
}

export default function GamesPage() {
	const games = getGames();

	return (
		<div className="min-h-screen bg-black px-3 sm:px-6 py-16 sm:py-20">
			<div className="mx-auto max-w-7xl">
				{/* 
					Mobile: 4 columns
					Tablet + Desktop: 6 columns
				*/}
				<GamesGrid games={games} />
			</div>
		</div>
	);
}
