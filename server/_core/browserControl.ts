import puppeteer, { Browser, Page } from "puppeteer";

let browser: Browser | null = null;
let pages: Map<string, Page> = new Map();

/**
 * Initialize browser instance
 */
export async function initBrowser() {
  if (browser) return browser;

  try {
    browser = await puppeteer.launch({
      headless: false, // Show browser window
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
    console.log("[Browser] Initialized successfully");
    return browser;
  } catch (error) {
    console.error("[Browser] Failed to initialize:", error);
    throw error;
  }
}

/**
 * Get or create a browser page
 */
export async function getPage(pageId: string = "default"): Promise<Page> {
  if (!browser) {
    await initBrowser();
  }

  if (pages.has(pageId)) {
    return pages.get(pageId)!;
  }

  const page = await browser!.newPage();
  pages.set(pageId, page);
  return page;
}

/**
 * Navigate to URL
 */
export async function navigateTo(url: string, pageId: string = "default") {
  const page = await getPage(pageId);
  await page.goto(url, { waitUntil: "networkidle2" });
  return { success: true, url };
}

/**
 * Create a new Google Doc
 */
export async function createGoogleDoc(title: string, pageId: string = "default") {
  const page = await getPage(pageId);

  // Navigate to Google Docs
  await page.goto("https://docs.google.com/document/create", {
    waitUntil: "networkidle2",
  });

  // Wait for document to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Set title
  await page.click('[aria-label="Untitled document"]');
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.up("Control");
  await page.keyboard.type(title);
  await page.keyboard.press("Enter");

  return {
    success: true,
    title,
    url: page.url(),
  };
}

/**
 * Write content to Google Doc
 */
export async function writeToGoogleDoc(
  content: string,
  pageId: string = "default"
) {
  const page = await getPage(pageId);

  // Click in document body
  await page.click('[role="textbox"]');

  // Type content in chunks to avoid issues
  const chunkSize = 100;
  for (let i = 0; i < content.length; i += chunkSize) {
    await page.keyboard.type(content.substring(i, i + chunkSize));
  }

  return {
    success: true,
    contentLength: content.length,
  };
}

/**
 * Take screenshot
 */
export async function takeScreenshot(
  pageId: string = "default"
): Promise<Buffer> {
  const page = await getPage(pageId);
  const screenshot = await page.screenshot({ type: "png" });
  return screenshot as Buffer;
}

/**
 * Execute JavaScript on page
 */
export async function executeScript(
  script: string,
  pageId: string = "default"
) {
  const page = await getPage(pageId);
  const result = await page.evaluate(script);
  return result;
}

/**
 * Fill form field
 */
export async function fillFormField(
  selector: string,
  value: string,
  pageId: string = "default"
) {
  const page = await getPage(pageId);
  await page.click(selector);
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.up("Control");
  await page.keyboard.type(value);
  return { success: true };
}

/**
 * Click element
 */
export async function clickElement(
  selector: string,
  pageId: string = "default"
) {
  const page = await getPage(pageId);
  await page.click(selector);
  return { success: true };
}

/**
 * Get page content
 */
export async function getPageContent(pageId: string = "default") {
  const page = await getPage(pageId);
  const content = await page.content();
  return { content };
}

/**
 * Close page
 */
export async function closePage(pageId: string = "default") {
  if (pages.has(pageId)) {
    const page = pages.get(pageId)!;
    await page.close();
    pages.delete(pageId);
    return { success: true };
  }
  return { success: false, error: "Page not found" };
}

/**
 * Close browser
 */
export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    pages.clear();
    return { success: true };
  }
  return { success: false };
}

/**
 * List all open pages
 */
export function listPages() {
  return Array.from(pages.keys());
}
