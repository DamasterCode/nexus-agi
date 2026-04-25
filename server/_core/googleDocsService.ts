import puppeteer, { Browser, Page } from "puppeteer";

let browser: Browser | null = null;

/**
 * Initialize browser for Google authentication
 */
export async function initBrowser() {
  if (browser) return browser;

  try {
    browser = await puppeteer.launch({
      headless: false, // Show browser window so user can see what's happening
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
      ],
    });
    console.log("[GoogleDocs] Browser initialized");
    return browser;
  } catch (error) {
    console.error("[GoogleDocs] Failed to initialize browser:", error);
    throw error;
  }
}

/**
 * Login to Google and create a new document
 */
export async function createGoogleDocWithContent(
  email: string,
  password: string,
  title: string,
  content: string
) {
  try {
    const browser = await initBrowser();
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });

    console.log("[GoogleDocs] Navigating to Google Docs...");
    await page.goto("https://docs.google.com/document/create", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for document to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if we need to login
    const loginButton = await page.$('[data-email]');
    if (loginButton) {
      console.log("[GoogleDocs] Logging in with email:", email);

      // Click on email field
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        await emailInput.click();
        await page.keyboard.type(email);
      await page.keyboard.press("Enter");
      await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Enter password
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.click();
        await page.keyboard.type(password);
        await page.keyboard.press("Enter");
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Wait for document editor to load
    console.log("[GoogleDocs] Waiting for document editor...");
    try {
      await page.waitForSelector('[role="textbox"]', { timeout: 20000 });
    } catch (e) {
      console.log("[GoogleDocs] Document editor selector not found, continuing anyway...");
    }

    // Set document title
    console.log("[GoogleDocs] Setting title:", title);
    const titleElement = await page.$('[aria-label="Untitled document"]');
    if (titleElement) {
      await titleElement.click();
      await page.keyboard.down("Control");
      await page.keyboard.press("a");
      await page.keyboard.up("Control");
      await page.keyboard.type(title);
      await page.keyboard.press("Enter");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Click in document body
    console.log("[GoogleDocs] Adding content...");
    const docBody = await page.$('[role="textbox"]');
    if (docBody) {
      await docBody.click();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Type content in chunks
      const chunkSize = 200;
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.substring(i, i + chunkSize);
        await page.keyboard.type(chunk);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Wait for auto-save
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the document URL
    const url = page.url();
    console.log("[GoogleDocs] Document created successfully:", url);

    // Keep browser open so user can see the document
    // Don't close the page - let user see it

    return {
      success: true,
      title,
      url,
      message: `Successfully created Google Doc: "${title}"`,
    };
  } catch (error) {
    console.error("[GoogleDocs] Error creating document:", error);
    throw error;
  }
}

/**
 * Close browser
 */
export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    console.log("[GoogleDocs] Browser closed");
  }
}

/**
 * Get browser status
 */
export function getBrowserStatus() {
  return {
    isOpen: browser !== null,
    message: browser ? "Browser is open and ready" : "Browser is not initialized",
  };
}
