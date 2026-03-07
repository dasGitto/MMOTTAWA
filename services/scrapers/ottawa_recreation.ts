import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables (fallback to local if missing)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const HAS_SUPABASE = SUPABASE_URL !== '' && SUPABASE_KEY !== '';

const supabase = HAS_SUPABASE ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const OTTAWA_REC_URL = 'https://register.ottawa.ca/';

async function politeDelay(page: any) {
  const ms = Math.floor(Math.random() * (4000 - 1500 + 1) + 1500);
  console.log(`[Delay] Waiting ${ms}ms...`);
  await page.waitForTimeout(ms);
}

async function scrapeOttawaDanceClasses() {
  console.log('🚀 Starting Ottawa Recreation Dance Scraper (TypeScript)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  try {
    console.log(`🌐 Navigating to ${OTTAWA_REC_URL}`);
    await page.goto(OTTAWA_REC_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await politeDelay(page);
    
    console.log('🖱️ Clicking Activities Dropdown...');
    await page.hover('.nav-activities-item > a');
    await page.waitForSelector('text="Dance"', { state: 'visible' });
    
    console.log('🩰 Clicking Dance Category...');
    await page.click('text="Dance"');
    
    console.log('🔄 Waiting for Dance category filter to apply...');
    await page.waitForTimeout(3000); // Wait for the AJAX filter to finish loading Dance cards
    
    console.log('⏳ Waiting for activity cards to load...');
    await page.waitForSelector('.activity-card', { timeout: 30000 });
    
    let allExtractedClasses: any[] = [];
    let hasNextPage = true;
    let pageNum = 1;
    
    while (hasNextPage && pageNum <= 3) { // Limit to 3 pages for the test
        console.log(`\n📄 Scraping Page ${pageNum}...`);
        await politeDelay(page);
        
        // Extract data from the current page
        const classesOnPage = await page.evaluate(() => {
            const cards = document.querySelectorAll('.activity-card');
            const data: any[] = [];
            
            cards.forEach(card => {
                const nameEl = card.querySelector('.activity-card-info__name-link a span');
                const locationEl = card.querySelector('.activity-card-info__location span');
                const datetimeEl = card.querySelector('.activity-card-info__datetime');
                const statusEl = card.querySelector('.activity-card__cornerMark');
                
                let schedule = 'Unknown Schedule';
                if (datetimeEl) {
                    const dateRange = datetimeEl.querySelector('.activity-card-info__dateRange span');
                    const timeRange = datetimeEl.querySelector('.activity-card-info__timeRange span');
                    schedule = `${dateRange ? dateRange.textContent?.trim() : ''} | ${timeRange ? timeRange.textContent?.trim() : ''}`;
                }
                
                data.push({
                    class_name: nameEl ? nameEl.textContent?.trim() : 'Unknown Class',
                    community_centre: locationEl ? locationEl.textContent?.trim() : 'Unknown Location',
                    schedule_raw: schedule,
                    status: statusEl ? statusEl.textContent?.trim() : 'Open',
                    scraped_at: new Date().toISOString()
                });
            });
            return data;
        });
        
        console.log(`✅ Extracted ${classesOnPage.length} classes from page ${pageNum}.`);
        allExtractedClasses = allExtractedClasses.concat(classesOnPage);
        
        // Try to click the "Next" pagination button
        try {
            const nextBtn = page.locator('button[aria-label="Next page"], a.pagination-next, button.next, .pagination-next, .pagination .next').first();
            const isDisabled = await nextBtn.evaluate(el => el.hasAttribute('disabled') || el.classList.contains('disabled')).catch(() => true);
            
            if (await nextBtn.isVisible() && !isDisabled) {
                console.log('➡️ Clicking Next Page...');
                await nextBtn.click();
                await page.waitForTimeout(3000); // Wait for network request to fire
                await page.waitForSelector('.activity-card', { state: 'attached' });
                pageNum++;
            } else {
                console.log('🛑 No more pages found or Next button disabled. Ending pagination.');
                hasNextPage = false;
            }
        } catch (e) {
            console.log('🛑 Pagination navigation failed or no more pages. Ending.');
            hasNextPage = false;
        }
    }
    
    console.log(`\n🎉 Scraping complete! Total classes extracted: ${allExtractedClasses.length}`);
    
    if (allExtractedClasses.length > 0) {
        // Log a sample
        console.log('Sample Data:', allExtractedClasses[0]);
        
        // Upsert to Supabase OR save to local JSON
        if (HAS_SUPABASE && supabase) {
            console.log('\n💾 Upserting data to Supabase table `recreation_classes`...');
            const { data, error } = await supabase!
                .from('recreation_classes')
                .upsert(allExtractedClasses, { onConflict: 'class_name, community_centre' })
                .select();
                
            if (error) {
                console.error('❌ Supabase Upsert Error:', error);
            } else {
                console.log(`✅ Successfully upserted ${data?.length} rows to Supabase!`);
            }
        } else {
            console.log('\n⚠️ No Supabase credentials found. Saving to local JSON file instead.');
            const dataDir = path.join(process.cwd(), 'src', 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            const filePath = path.join(dataDir, 'ottawa_dance_classes.json');
            fs.writeFileSync(filePath, JSON.stringify(allExtractedClasses, null, 2));
            console.log(`✅ Successfully wrote ${allExtractedClasses.length} rows to ${filePath}`);
        }
    } else {
        console.log('⚠️ No classes extracted. Check the DOM selectors.');
    }

  } catch (error) {
      console.error('❌ Scraper failed with error:', error);
  } finally {
      await browser.close();
      console.log('👋 Browser closed.');
  }
}

scrapeOttawaDanceClasses().catch(console.error);
