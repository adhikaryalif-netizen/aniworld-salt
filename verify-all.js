const http = require('http');

async function testEndpoint(name, url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      console.log(`❌ ${name} | Error: Invalid JSON | URL: ${url}`);
      return;
    }
    
    if (res.status === 200 && data.success) {
      console.log(`✅ ${name} | Status: 200 | URL: ${url}`);
    } else {
      console.log(`❌ ${name} | Status: ${res.status} | URL: ${url} | Error: ${data.message || data.error || 'Unknown'}`);
    }
  } catch(e) {
    console.log(`❌ ${name} | Fetch Failed: ${e.message} | URL: ${url}`);
  }
}

async function runTests() {
  const baseUrl = 'https://aniworld-salt.adhikaryalif.workers.dev/api';
  console.log('--- RUNNING CLOUDFLARE LIVE API TESTS ---\n');

  await Promise.all([
    testEndpoint('Home', `${baseUrl}/home`),
    testEndpoint('Details', `${baseUrl}/info/jujutsu-kaisen-0`),
    testEndpoint('Episodes', `${baseUrl}/episodes/tokyo-ghoul/Season-1`),
    testEndpoint('Embed API', `${baseUrl}/embed/jujutsu-kaisen-0`),
    testEndpoint('Search Query', `${baseUrl}/search?q=naruto`),
    testEndpoint('Search Suggestion', `${baseUrl}/search?suggestion=one`),
    testEndpoint('Category (Genre)', `${baseUrl}/category/genre/action/`),
    testEndpoint('Category (Network)', `${baseUrl}/category/network/cartoon-network/`),
    testEndpoint('Letter Browse', `${baseUrl}/letter/n/`)
  ]);
  
  console.log('\n--- TESTS COMPLETED ---');
}

runTests();
