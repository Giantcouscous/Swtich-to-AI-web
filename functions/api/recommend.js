<script>
const SUPABASE_URL = 'https://tfezfqoawgjugivwajfo.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';

const params = new URLSearchParams(window.location.search);

const userName    = params.get('name') || '';
const userCompany = params.get('company') || '';
const userPain    = params.get('pain') || '';

/* ─────────────────────────────────────────────────────────────
   LOADING STEPS
───────────────────────────────────────────────────────────── */
function animateLoadingSteps() {
  const steps = ['step-1','step-2','step-3','step-4'];
  let current = 0;

  const interval = setInterval(() => {
    if (current > 0) {
      document.getElementById(steps[current - 1]).classList.remove('active');
      document.getElementById(steps[current - 1]).classList.add('done');
    }

    if (current < steps.length) {
      document.getElementById(steps[current]).classList.add('active');
      current++;
    } else {
      clearInterval(interval);
    }
  }, 1800);
}

/* ─────────────────────────────────────────────────────────────
   WORKER API CALL
───────────────────────────────────────────────────────────── */
async function getToolRecommendation() {

  const response = await fetch('/api/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pain: userPain,
      company: userCompany,
      name: userName
    })
  });

  const raw = await response.text();

  console.log('API status:', response.status);
  console.log('Raw API response:', raw);

  if (!response.ok) {
    throw new Error(`API failed: ${response.status} ${raw}`);
  }

  return JSON.parse(raw);
}

/* ─────────────────────────────────────────────────────────────
   SAVE LEAD ONLY
───────────────────────────────────────────────────────────── */
async function saveLead(toolName) {

  try {

    const { createClient } = supabase;

    const db = createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    await db.from('leads').insert({
      name: userName || null,
      company: userCompany || null,
      pain_point: userPain,
      tool_recommended: toolName
    });

  } catch (e) {

    console.warn('Lead save failed:', e);

  }
}

/* ─────────────────────────────────────────────────────────────
   RENDER TOOL
───────────────────────────────────────────────────────────── */
function renderRecommendation(tool) {

  if (userName) {

    document.getElementById('greeting').textContent =
      `Here's your recommendation, ${userName.split(' ')[0]}`;

  }

  document.getElementById('tool-headline-pain').textContent =
    tool.pain_summary || 'your problem';

  if (userCompany) {

    document.getElementById('tool-context-text').textContent =
      `Based on what you told us about ${userCompany}, here's the most impactful tool we found.`;

  } else {

    document.getElementById('tool-context-text').textContent =
      `Based on what you told us, here's the most impactful tool we found.`;

  }

  document.getElementById('tool-name').textContent =
    tool.tool_name;

  document.getElementById('tool-why').textContent =
    tool.why_it_fits;

  document.getElementById('tool-desc').textContent =
    tool.what_it_does;

  document.getElementById('tool-price').textContent =
    tool.price;

  document.getElementById('tool-setup').textContent =
    `Setup: ${tool.setup_time}`;

  const linkEl = document.getElementById('tool-link');

  linkEl.href = tool.url;

  linkEl.innerHTML = `
    Visit ${tool.tool_name}
    →
  `;
}

/* ─────────────────────────────────────────────────────────────
   SHOW CONTENT
───────────────────────────────────────────────────────────── */
function showContent() {

  document.getElementById('loading-section').style.display = 'none';

  const main = document.getElementById('main-content');

  main.style.display = 'block';
  main.style.animation = 'fadeIn 0.6s ease both';
}

/* ─────────────────────────────────────────────────────────────
   FALLBACK
───────────────────────────────────────────────────────────── */
function getFallback() {

  return {
    tool_name: 'Tool recommendation unavailable',
    why_it_fits: 'The recommendation API is temporarily unavailable.',
    what_it_does: 'Please try again shortly.',
    price: '-',
    setup_time: '-',
    url: 'https://switchtoai.ai',
    pain_summary: 'temporary issue'
  };
}

/* ─────────────────────────────────────────────────────────────
   LIGHTBOX
───────────────────────────────────────────────────────────── */
const CASE_PREVIEWS = {

  retail: {
    pages: [
      ['/Asset/case-previews/retail-circle/page-1.jpg','Cover summary'],
      ['/Asset/case-previews/retail-circle/page-2.jpg','Executive summary'],
      ['/Asset/case-previews/retail-circle/page-3.jpg','Impact / effort matrix'],
      ['/Asset/case-previews/retail-circle/page-4.jpg','Quick wins'],
      ['/Asset/case-previews/retail-circle/page-8.jpg','Financial impact']
    ]
  },

  tacos: {
    pages: [
      ['/Asset/case-previews/tacos-collective/page-1.jpg','Cover summary'],
      ['/Asset/case-previews/tacos-collective/page-2.jpg','Executive summary'],
      ['/Asset/case-previews/tacos-collective/page-4.jpg','Impact / effort matrix'],
      ['/Asset/case-previews/tacos-collective/page-5.jpg','Quick wins'],
      ['/Asset/case-previews/tacos-collective/page-9.jpg','Financial impact']
    ]
  }

};

let lbPages = [];
let lbIndex = 0;

function openLightbox(caseId, startIndex = 0) {

  const data = CASE_PREVIEWS[caseId];

  if (!data) return;

  lbPages = data.pages;
  lbIndex = startIndex;

  updateLightbox();

  document.getElementById('lightbox').classList.add('open');

  document.body.style.overflow = 'hidden';
}

function updateLightbox() {

  const [src, caption] = lbPages[lbIndex];

  document.getElementById('lb-img').src = src;
  document.getElementById('lb-caption').textContent = caption;

  document.getElementById('lb-counter').textContent =
    `${lbIndex + 1} / ${lbPages.length}`;

  document.getElementById('lb-prev').style.opacity =
    lbIndex === 0 ? '0.3' : '1';

  document.getElementById('lb-next').style.opacity =
    lbIndex === lbPages.length - 1 ? '0.3' : '1';
}

function closeLightbox() {

  document.getElementById('lightbox').classList.remove('open');

  document.body.style.overflow = '';
}

function lbNav(dir) {

  const next = lbIndex + dir;

  if (next >= 0 && next < lbPages.length) {

    lbIndex = next;

    updateLightbox();
  }
}

document.getElementById('lightbox').addEventListener('click', function(e) {

  if (e.target === this) {
    closeLightbox();
  }

});

document.addEventListener('keydown', (e) => {

  if (e.key === 'Escape') {
    closeLightbox();
  }

  if (e.key === 'ArrowLeft') {
    lbNav(-1);
  }

  if (e.key === 'ArrowRight') {
    lbNav(1);
  }

});

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────── */
async function init() {

  if (!userPain) {
    window.location.href = '/';
    return;
  }

  if (userName) {

    document.getElementById('loading-name-text').textContent =
      `Searching for the best match for ${userName.split(' ')[0]}...`;

  }

  animateLoadingSteps();

  let tool;

  try {

    tool = await getToolRecommendation();

  } catch (e) {

    console.error('Recommendation failed:', e);

    tool = getFallback();
  }

  renderRecommendation(tool);

  saveLead(tool.tool_name).catch(console.warn);

  setTimeout(showContent, 500);
}

init();
</script>
