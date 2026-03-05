import { schedule } from '@netlify/functions';
import { chromium } from 'playwright'; // Use 'playwright' for local, wrap for 'playwright-core' in prod
import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

// Load environment variables for local testing
loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:5432';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'local-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_URLS = [
    { url: 'https://www.eventbrite.ca/d/canada--ottawa/dance--events/', category: 'Dance' },
    { url: 'https://www.eventbrite.ca/d/canada--ottawa/fitness--events/', category: 'Fitness' }
];

// Polite extraction delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const pulseScraper = async () => {
    console.log('Initiating Daily Pulse Scraper...');

    // Netlify Lambda uses playwright-core (requires external Chromium layer)
    // Local testing uses standard playwright. We default to standard for local dev.
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const allEvents = [];

    for (const { url, category } of TARGET_URLS) {
        console.log(`Navigating to ${category} Events: ${url}`);
        const page = await context.newPage();

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await delay(2000); // 2-second polite delay per rules

            // Minimalist Extract: Eventbrite's typical structure
            const events = await page.$$eval('div.discover-search-desktop-card, section.event-card-details', (cards, cat) => {
                return cards.map(c => {
                    const titleEl = c.querySelector('h2, h3');
                    const title = titleEl ? titleEl.textContent?.trim() : '';

                    const urlEl = c.querySelector('a') || c.closest('a');
                    const event_url = urlEl ? urlEl.href : '';

                    const paragraphs = Array.from(c.querySelectorAll('p'));
                    let event_date = new Date().toISOString(); // Fallback
                    let location_name = 'Ottawa'; // Fallback

                    if (paragraphs.length >= 2) {
                        // Extracting crude text depending on EB's A/B structure
                        const rawDate = paragraphs[0].textContent?.trim() || '';
                        location_name = paragraphs[1].textContent?.trim() || 'Ottawa';

                        // Parse simple dates if possible, else keep ISO string
                        if (rawDate) {
                            try { event_date = new Date(rawDate).toISOString(); }
                            catch { /* Ignore */ }
                        }
                    }

                    return {
                        title: title || 'Untitled Event',
                        event_date,
                        location_name,
                        event_url,
                        category: cat,
                        is_live: true
                    };
                }).filter(e => e.title && e.event_url);
            }, category);

            console.log(`Extracted ${events.length} ${category} events.`);
            allEvents.push(...events);

        } catch (error) {
            console.error(`Error scraping ${url}:`, error);
        } finally {
            await page.close();
            await delay(2000); // Polite delay before next category
        }
    }

    await browser.close();

    if (allEvents.length === 0) {
        console.log('No events found. Exiting.');
        return;
    }

    // Try Supabase first
    console.log('Attempting Supabase sync...');
    let supabaseSuccess = false;
    try {
        const { error: upsertError } = await supabase
            .from('pulse_events')
            .upsert(allEvents, { onConflict: 'event_url' });

        if (!upsertError) {
            console.log(`Successfully synced ${allEvents.length} events to Supabase.`);
            supabaseSuccess = true;
            await supabase.from('pulse_events').delete().lt('event_date', new Date().toISOString());
        } else {
            console.error('Supabase Upsert Error:', upsertError.message);
        }
    } catch (e: any) {
        console.error('Supabase Connection Failed:', e.message);
    }

    // Fallback System for Local Dev
    if (!supabaseSuccess) {
        console.log('Falling back to local JSON cache (public/data/pulse_events.json)...');
        const fs = require('fs');
        const dir = './public/data';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(`${dir}/pulse_events.json`, JSON.stringify(allEvents, null, 2));
        console.log('Local fallback cache updated successfully!');
    }
};

// 1. Netlify CRON Handler (4:00 AM EST)
export const handler = schedule("0 4 * * *", async (event) => {
    await pulseScraper();
    return { statusCode: 200 };
});

// 2. Local Testing Invocation (When run via `ts-node` or `tsx` locally)
if (require.main === module) {
    pulseScraper().then(() => process.exit(0));
}
