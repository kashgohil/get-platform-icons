import fs from 'fs';
import path from 'path';
import puppeteer, { Page } from 'puppeteer';

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
const fetchIcon = async (platform: Platform, page: Page): Promise<void> => {
	try {
		console.log(`Fetching icon for: ${platform.name}`);
		await page.goto(platform.url, { waitUntil: 'networkidle2' });

		// Extract the favicon URL
		const iconUrl = await page.evaluate(() => {
			const linkElement = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
			return linkElement ? linkElement.href : null;
		});

		if (iconUrl && iconUrl.endsWith('.svg')) {
			console.log(`Found SVG icon: ${iconUrl}`);

			// Download the SVG
			const response = await page.goto(iconUrl);
			if (response) {
				const svgContent = await response.text();

				// Save the SVG file
				const filePath = path.join(outputDir, `${platform.name}.svg`);
				fs.writeFileSync(filePath, svgContent);
				console.log(`Saved SVG icon for ${platform.name} at ${filePath}`);
			}
		} else {
			console.warn(`No SVG icon found for ${platform.name}`);
		}
	} catch (error) {
		console.error(`Error fetching icon for ${platform.name}:`, (error as Error).message);
	}
};

// Main function to process all platforms
const scrapeIcons = async (platforms: Array<Platform>) => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	for (const platform of platforms) {
		await fetchIcon(platform, page);
	}

	await browser.close();
	console.log('Icon scraping completed.');
};

export { scrapeIcons };
