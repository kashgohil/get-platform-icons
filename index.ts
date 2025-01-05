import fs from 'fs';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';

// Define the platform type
type Platform = {
	name: string;
	url: string;
};

// Directory to save icons
const outputDir = path.join(__dirname, 'icons');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir);
}


// Function to scrape and save icons
const fetchIcon = async (platform: Platform, browser: Browser): Promise<void> => {
	const page = await browser.newPage();

	const getIcon = async (extension: string, iconUrl: string) => {
		// Download the SVG
		try {
			const response = await page.goto(iconUrl);
			if (extension === 'svg') {
				if (response) {
					const svgContent = await response.text();

					// Save the PNG file
					const filePath = path.join(outputDir, `${platform.name}.${extension}`);
					fs.writeFileSync(filePath, svgContent);
					console.log(`${platform.name} - ${extension.toUpperCase()} -> ${filePath}`);
				}
			} else {
				if (response) {
					const content = await response.buffer();

					// Save the PNG file
					const filePath = path.join(outputDir, `${platform.name}.${extension}`);
					fs.writeFileSync(filePath, content);
					console.log(`${platform.name} - ${extension.toUpperCase()} -> ${filePath}`);
				}
			}
		} catch (e) {
			throw e;
		}
	};

	try {
		console.log(`Fetching icon for: ${platform.name}`);
		await page.goto(platform.url, { waitUntil: 'networkidle2' });

		await page.waitForSelector("link[rel='icon'], link[rel='shortcut icon']", { timeout: 5000 });

		// Extract the favicon URL
		let iconUrl = await page.evaluate(() => {
			const linkElements = Array.from(document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']"));
			// Filter for SVG first
			const svgLink = linkElements.find((el) => el.getAttribute('href')?.includes('.svg'));
			if (svgLink) return svgLink.getAttribute('href');
			// Filter for PNG first
			const pngLink = linkElements.find((el) => el.getAttribute('href')?.includes('.png'));
			if (pngLink) return pngLink.getAttribute('href');

			// Fallback to any icon link
			return linkElements.length > 0 ? linkElements[0].getAttribute('href') : null;
		});

		if (iconUrl) {
			iconUrl = new URL(iconUrl, platform.url).toString();
		}

		if (iconUrl) {
			if (iconUrl.includes('.svg')) {
				await getIcon('svg', iconUrl);
			} else if (iconUrl.includes('.png')) {
				await getIcon('png', iconUrl);
			} else if (iconUrl.includes('.ico')) {
				await getIcon('ico', iconUrl);
			}
		} else {
			console.warn(`-- ${platform.name}: NO ICON --`);
		}
	} catch (error) {
		console.error(`${platform.name}: ERROR: `, (error as Error).message);
	} finally {
		await page.close();
	}
};

// Main function to process all platforms
const scrapeIcons = async (platforms: Array<Platform>) => {
	const browser = await puppeteer.launch();

	const CONCURRENCY = 5;
	const chunks = Array(Math.ceil(platforms.length / CONCURRENCY))
		.fill(null)
		.map((_, i) => platforms.slice(i * CONCURRENCY, (i + 1) * CONCURRENCY));

	for (const chunk of chunks) {
		await Promise.all(chunk.map((platform) => fetchIcon(platform, browser)));
	}

	await browser.close();
	console.log('Icon scraping completed.');
};

export { scrapeIcons };
