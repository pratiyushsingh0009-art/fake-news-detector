// ================================================
// Fake News Detector - JavaScript Logic
// ================================================

// Default Google API key provided by the user.
const GOOGLE_FACT_CHECK_API_KEY = 'AIzaSyB4dvDp2qmgzTzvT7ELFQhxWKbB1Yf3t5c';

// State Management
const state = {
    isAnalyzing: false,
    lastAnalysis: null
};

// Fake News Indicators Database
const fakeNewsIndicators = {
    highSuspicionWords: [
        'shocking', 'unbelievable', 'disgusting', 'horrific', 'scandal',
        'bombshell', 'exclusive', 'exposed', 'leaked', 'breaking',
        'you won\'t believe', 'this will shock you', 'doctors hate',
        'this one trick', 'you have to see', 'why i quit', 'gone wrong',
        'must watch', 'they don\'t want', 'cover-up', 'conspiracy',
        'deep state', 'wake up', 'truth is', 'false flag', 'mainstream media',
        'elite', 'secret', 'hidden', 'suppressed', 'miracle', 'cure', 'forbidden'
    ],
    exaggeratedWords: [
        'absolutely', 'definitely', 'without a doubt', 'guaranteed',
        'proven', 'fact', 'obvious', 'clearly', 'everyone knows',
        'the truth is', 'no one talks about'
    ],
    inflammatoryTerms: [
        'fake', 'hoax', 'lies', 'conspiracy', 'cover-up', 'corruption',
        'evil', 'enemy', 'threat', 'danger', 'invasion', 'destroy',
        'war', 'attack', 'criminal', 'corrupt', 'betrayal', 'treason',
        'hate', 'disgusting', 'unacceptable', 'outrage', 'scandal'
    ],
    vagueLanguage: [
        'sources say', 'some people say', 'anonymous sources', 'they say',
        'it is said', 'reportedly', 'allegedly', 'claims', 'supposedly',
        'possibly', 'could be', 'may be', 'it seems', 'it appears'
    ],
    satiricalSources: [
        'the onion', 'babylon bee', 'clickhole', 'thehardtimes',
        'nottheonion', 'reductio', 'thespoof', 'newsthump', 'hard drive',
        'hard times'
    ],
    unreliableDomains: [
        'naturalnews.com', 'infowars.com', 'beforeitsnews.com',
        'zerohedge.com', 'breitbart.com', 'globalresearch.ca',
        'activistpost.com'
    ]
};

const trustScoreThresholds = {
    authentic: { min: 80, icon: '✓', verdict: 'Likely Authentic', class: 'authentic' },
    suspicious: { min: 40, icon: '⚠️', verdict: 'Suspicious', class: 'suspicious' },
    misinformation: { min: 0, icon: '✗', verdict: 'Highly Probable Misinformation', class: 'misinformation' }
};

const newsInput = document.getElementById('newsInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const charCount = document.getElementById('charCount');
const resultSection = document.getElementById('resultSection');
const loadingState = document.getElementById('loadingState');
const resultContent = document.getElementById('resultContent');
const trustScoreElement = document.getElementById('trustScore');
const scoreCircleFill = document.getElementById('scoreCircleFill');
const verdictTitle = document.getElementById('verdictTitle');
const verdictIcon = document.getElementById('verdictIcon');
const verdictDescription = document.getElementById('verdictDescription');
const indicatorsList = document.getElementById('indicatorsList');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const settingsToggle = document.getElementById('settingsToggle');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const googleFactCheckKeyInput = document.getElementById('googleFactCheckKey');
const newsApiKeyInput = document.getElementById('newsApiKey');

analyzeBtn.addEventListener('click', handleAnalyze);
newAnalysisBtn.addEventListener('click', startNewAnalysis);
newsInput.addEventListener('input', updateCharCount);
settingsToggle.addEventListener('click', openSettingsModal);
closeSettings.addEventListener('click', closeSettingsModal);
saveSettings.addEventListener('click', saveAPISettings);
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettingsModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !settingsModal.classList.contains('hidden')) {
        closeSettingsModal();
    }
});

function openSettingsModal() {
    settingsModal.classList.remove('hidden');
    googleFactCheckKeyInput.value = localStorage.getItem('googleFactCheckKey') || GOOGLE_FACT_CHECK_API_KEY;
    newsApiKeyInput.value = localStorage.getItem('newsApiKey') || '';
}

function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}

function saveAPISettings() {
    const googleKey = googleFactCheckKeyInput.value.trim();
    const newsKey = newsApiKeyInput.value.trim();
    if (googleKey.length > 0) localStorage.setItem('googleFactCheckKey', googleKey);
    if (newsKey.length > 0) localStorage.setItem('newsApiKey', newsKey);
    alert('✓ API keys saved locally.');
    closeSettingsModal();
}

function getStoredAPIKey(keyName) {
    if (keyName === 'googleFactCheckKey') {
        return localStorage.getItem('googleFactCheckKey') || GOOGLE_FACT_CHECK_API_KEY;
    }
    return localStorage.getItem(keyName) || '';
}

async function handleAnalyze() {
    const text = newsInput.value.trim();
    if (!text) {
        alert('Please enter some text to analyze');
        return;
    }
    if (text.length < 10) {
        alert('Please enter at least 10 characters for meaningful analysis');
        return;
    }
    state.isAnalyzing = true;
    analyzeBtn.disabled = true;
    resultSection.classList.remove('hidden');
    loadingState.classList.remove('hidden');
    resultContent.classList.add('hidden');
    await simulateAPIAnalysis(text);
    state.isAnalyzing = false;
    analyzeBtn.disabled = false;
}

async function simulateAPIAnalysis(text) {
    try {
        const claims = extractKeyClaimsFromText(text);
        const factCheckResults = await performFactChecking(claims, text);
        const textAnalysis = analyzeTextContent(text);
        const analysisResult = mergeAnalysisResults(textAnalysis, factCheckResults);
        state.lastAnalysis = analysisResult;
        displayResults(analysisResult);
    } catch (error) {
        console.error('Analysis error:', error);
        const analysisResult = analyzeTextContent(text);
        state.lastAnalysis = analysisResult;
        displayResults(analysisResult);
    }
}

async function performFactChecking(claims, text) {
    const results = {
        verifiedClaims: 0,
        debunkedClaims: 0,
        unverifiedClaims: 0,
        indicators: [],
        penalty: 0
    };

    const googleResult = await checkWithGoogleFactCheck(claims);
    if (googleResult) {
        results.indicators.push(...googleResult.indicators);
        results.penalty += googleResult.penalty;
        return results;
    }

    const localResult = performLocalFactChecking(claims, text);
    results.indicators.push(...localResult.indicators);
    results.penalty += localResult.penalty;
    return results;
}

async function checkWithGoogleFactCheck(claims) {
    const API_KEY = getStoredAPIKey('googleFactCheckKey');
    if (!API_KEY || API_KEY.length === 0) return null;

    try {
        const results = { indicators: [], penalty: 0 };
        for (let claim of claims.slice(0, 3)) {
            const response = await fetch(
                `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(claim)}&key=${API_KEY}`
            );
            if (!response.ok) continue;
            const data = await response.json();
            if (data.claims && data.claims.length > 0) {
                data.claims.forEach(claimData => {
                    if (claimData.claimReview && claimData.claimReview.length > 0) {
                        const review = claimData.claimReview[0];
                        const rating = review.textualRating || review.title || 'reviewed';
                        const publisher = review.publisher?.name || 'Fact Check Source';
                        if (/FALSE|MOSTLY FALSE/i.test(rating)) {
                            results.indicators.push({
                                name: `❌ Debunked by ${publisher}: "${claim.substring(0, 60)}..."`,
                                severity: 'critical',
                                icon: '🚫'
                            });
                            results.penalty += 50;
                        } else if (/TRUE|MOSTLY TRUE/i.test(rating)) {
                            results.indicators.push({
                                name: `✓ Verified by ${publisher}: "${claim.substring(0, 60)}..."`,
                                severity: 'positive',
                                icon: '✓'
                            });
                            results.penalty -= 20;
                        } else {
                            results.indicators.push({
                                name: `❓ Mixed review by ${publisher}: "${claim.substring(0, 60)}..."`,
                                severity: 'medium',
                                icon: '⚖️'
                            });
                            results.penalty += 15;
                        }
                    }
                });
            }
        }
        return results.indicators.length > 0 ? results : null;
    } catch (error) {
        console.error('Google Fact Check API error:', error);
        return null;
    }
}

const knownDebunkedClaims = [
    { claim: 'earth is flat', source: 'NASA, Scientific consensus' },
    { claim: 'vaccines cause autism', source: 'CDC, WHO, 1000+ studies' },
    { claim: 'moon landing was fake', source: 'NASA, Independent verification' },
    { claim: 'climate change is hoax', source: 'IPCC, 97% scientists' },
    { claim: '5g causes covid', source: 'WHO, Scientists' },
    { claim: 'microchips in vaccines', source: 'MIT, FDA verification' },
    { claim: 'chemtrails controlling weather', source: 'Meteorologists' }
];

const knownVerifiedClaims = [
    { claim: 'covid-19 pandemic', source: 'WHO, CDC' },
    { claim: 'global warming exists', source: 'IPCC, Scientists' },
    { claim: 'water is h2o', source: 'Chemistry' }
];

function performLocalFactChecking(claims, text) {
    const results = { indicators: [], penalty: 0 };
    const lowerText = text.toLowerCase();
    knownDebunkedClaims.forEach(item => {
        if (lowerText.includes(item.claim)) {
            results.indicators.push({
                name: `❌ Debunked claim detected: "${item.claim}" - ${item.source}`,
                severity: 'critical',
                icon: '🚫'
            });
            results.penalty += 40;
        }
    });
    knownVerifiedClaims.forEach(item => {
        if (lowerText.includes(item.claim)) {
            results.indicators.push({
                name: `✓ Verified fact detected: "${item.claim}" - ${item.source}`,
                severity: 'positive',
                icon: '✓'
            });
            results.penalty -= 15;
        }
    });
    if (results.indicators.length === 0) {
        results.indicators.push({
            name: 'No exact known claim matches found in local verification database.',
            severity: 'neutral',
            icon: 'ℹ️'
        });
    }
    return results;
}

function extractKeyClaimsFromText(text) {
    const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
    return sentences
        .map(sentence => sentence.trim().replace(/[.!?]+$/, ''))
        .filter(sentence => sentence.length > 10 && sentence.length < 200)
        .slice(0, 5);
}

function mergeAnalysisResults(textAnalysis, factCheckResults) {
    const merged = { ...textAnalysis };
    if (!factCheckResults) {
        merged.detectedIndicators.push({
            name: '⚠️ No API verification completed. Using internal language analysis only.',
            severity: 'medium',
            icon: '⚠️'
        });
        return merged;
    }
    merged.detectedIndicators.push(...factCheckResults.indicators.filter(item => item.severity !== 'positive'));
    merged.passedIndicators.push(...factCheckResults.indicators.filter(item => item.severity === 'positive'));
    merged.scores.factVerification = Math.max(0, factCheckResults.penalty);
    const totalPenalty = Object.values(merged.scores).reduce((acc, value) => acc + value, 0);
    merged.trustScore = Math.max(0, Math.min(100, 100 - totalPenalty));
    return merged;
}

function analyzeTextContent(text) {
    const lowerText = text.toLowerCase();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const sentenceCount = Math.max(1, (text.match(/[.!?]+/g) || []).length);
    const analysis = {
        detectedIndicators: [],
        passedIndicators: [],
        scores: {
            clickbait: 0,
            capitalization: 0,
            inflammatory: 0,
            exaggeration: 0,
            vagueness: 0,
            punctuation: 0,
            structure: 0,
            emotion: 0,
            source: 0,
            factVerification: 0
        },
        trustScore: 100
    };

    const suspicionMatches = countMatches(lowerText, fakeNewsIndicators.highSuspicionWords);
    if (suspicionMatches > 0) {
        const matchedWords = getMatchingWords(lowerText, fakeNewsIndicators.highSuspicionWords).slice(0, 3);
        analysis.detectedIndicators.push({ name: `High-suspicion language detected: ${matchedWords.join(', ')}`, severity: 'high', icon: '🚨' });
        analysis.scores.clickbait = Math.min(40, suspicionMatches * 8);
    } else {
        analysis.passedIndicators.push({ name: 'No sensational clickbait language detected', icon: '✓' });
    }

    const capsPercentage = calculateCapsPercentage(text);
    if (capsPercentage > 30) {
        analysis.detectedIndicators.push({ name: `Excessive capitalization detected: ${capsPercentage}%`, severity: 'high', icon: '📢' });
        analysis.scores.capitalization = Math.min(30, (capsPercentage - 10) * 1.5);
    } else if (capsPercentage > 15) {
        analysis.detectedIndicators.push({ name: `Unusual capitalization pattern: ${capsPercentage}%`, severity: 'medium', icon: '📢' });
        analysis.scores.capitalization = 12;
    } else {
        analysis.passedIndicators.push({ name: 'Proper capitalization usage', icon: '✓' });
    }

    const inflammatoryMatches = countMatches(lowerText, fakeNewsIndicators.inflammatoryTerms);
    if (inflammatoryMatches > 5) {
        analysis.detectedIndicators.push({ name: `Heavy inflammatory language: ${inflammatoryMatches} terms`, severity: 'critical', icon: '🔥' });
        analysis.scores.inflammatory = Math.min(35, inflammatoryMatches * 6);
    } else if (inflammatoryMatches > 2) {
        analysis.detectedIndicators.push({ name: `Inflammatory language present: ${inflammatoryMatches} terms`, severity: 'high', icon: '🔥' });
        analysis.scores.inflammatory = Math.min(25, inflammatoryMatches * 4);
    } else {
        analysis.passedIndicators.push({ name: 'Neutral emotional tone', icon: '✓' });
    }

    const exaggeratedMatches = countMatches(lowerText, fakeNewsIndicators.exaggeratedWords);
    if (exaggeratedMatches > 8) {
        analysis.detectedIndicators.push({ name: `Excessive absolutes detected: ${exaggeratedMatches} terms`, severity: 'high', icon: '💯' });
        analysis.scores.exaggeration = Math.min(35, exaggeratedMatches * 3);
    } else if (exaggeratedMatches > 4) {
        analysis.detectedIndicators.push({ name: `Multiple absolute claims: ${exaggeratedMatches} terms`, severity: 'medium', icon: '💯' });
        analysis.scores.exaggeration = Math.min(20, exaggeratedMatches * 2);
    } else {
        analysis.passedIndicators.push({ name: 'Balanced language without excessive absolutes', icon: '✓' });
    }

    const vagueMatches = countMatches(lowerText, fakeNewsIndicators.vagueLanguage);
    if (vagueMatches > 4) {
        analysis.detectedIndicators.push({ name: `Vague attribution detected: ${vagueMatches} terms`, severity: 'critical', icon: '❓' });
        analysis.scores.vagueness = Math.min(40, vagueMatches * 7);
    } else if (vagueMatches > 1) {
        analysis.detectedIndicators.push({ name: `Unverified claims without sources: ${vagueMatches} terms`, severity: 'high', icon: '❓' });
        analysis.scores.vagueness = Math.min(30, vagueMatches * 5);
    } else {
        analysis.passedIndicators.push({ name: 'Claims are broadly attributed or appear factual', icon: '✓' });
    }

    const emotionalMatches = countMatches(lowerText, fakeNewsIndicators.emotionalTriggers || []);
    if (emotionalMatches > 6) {
        analysis.detectedIndicators.push({ name: `Emotion-baiting language: ${emotionalMatches} terms`, severity: 'medium', icon: '😠' });
        analysis.scores.emotion = Math.min(25, emotionalMatches * 3);
    }

    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;
    if (exclamationCount > wordCount * 0.12 || (exclamationCount > 5 && wordCount < 50)) {
        analysis.detectedIndicators.push({ name: `Excessive punctuation: ${exclamationCount} exclamation marks`, severity: 'medium', icon: '❗' });
        analysis.scores.punctuation = 18;
    } else if (questionCount > wordCount * 0.08) {
        analysis.detectedIndicators.push({ name: `Rhetorical questions overused: ${questionCount} instances`, severity: 'low', icon: '❓' });
        analysis.scores.punctuation = 10;
    }

    const avgSentenceLength = text.length / sentenceCount;
    if (avgSentenceLength < 15 && wordCount > 50) {
        analysis.detectedIndicators.push({ name: 'Fragmented structure with short sentences', severity: 'low', icon: '⚙️' });
        analysis.scores.structure = 8;
    } else {
        analysis.passedIndicators.push({ name: 'Coherent article structure', icon: '✓' });
    }

    const satiricalMatch = fakeNewsIndicators.satiricalSources.some(source => lowerText.includes(source));
    const unreliableMatch = fakeNewsIndicators.unreliableDomains.some(domain => lowerText.includes(domain));
    if (satiricalMatch) {
        analysis.detectedIndicators.push({ name: 'Known satirical source referenced', severity: 'critical', icon: '🎭' });
        analysis.scores.source = 60;
    } else if (unreliableMatch) {
        analysis.detectedIndicators.push({ name: 'Known unreliable source referenced', severity: 'critical', icon: '🚫' });
        analysis.scores.source = 50;
    } else {
        analysis.passedIndicators.push({ name: 'No known unreliable sources detected', icon: '✓' });
    }

    analysis.trustScore = Math.max(0, Math.min(100, 100 - Object.values(analysis.scores).reduce((sum, value) => sum + value, 0)));
    return analysis;
}

function countMatches(text, keywords) {
    let count = 0;
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) count += matches.length;
    });
    return count;
}

function getMatchingWords(text, keywords) {
    return keywords.filter(keyword => text.includes(keyword.toLowerCase()));
}

function calculateCapsPercentage(text) {
    const letters = text.match(/[a-zA-Z]/g) || [];
    if (letters.length === 0) return 0;
    const caps = text.match(/[A-Z]/g) || [];
    return Math.round((caps.length / letters.length) * 100);
}

function updateCharCount() {
    charCount.textContent = newsInput.value.length;
}

function displayResults(analysis) {
    loadingState.classList.add('hidden');
    resultContent.classList.remove('hidden');
    const score = Math.round(analysis.trustScore);
    trustScoreElement.textContent = score;
    updateScoreCircle(score);
    const verdictCategory = score >= 80 ? trustScoreThresholds.authentic : score >= 40 ? trustScoreThresholds.suspicious : trustScoreThresholds.misinformation;
    verdictTitle.textContent = verdictCategory.verdict;
    verdictIcon.textContent = verdictCategory.icon;
    verdictDescription.textContent = getVerdictDescription(score);
    document.querySelector('.verdict-card').className = `verdict-card ${verdictCategory.class}`;
    displayIndicators(analysis);
}

function updateScoreCircle(score) {
    const circumference = 282.7;
    const offset = circumference - (score / 100) * circumference;
    const strokeColor = score >= 80 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    scoreCircleFill.style.stroke = strokeColor;
    scoreCircleFill.style.strokeDashoffset = offset;
}

function getVerdictDescription(score) {
    if (score >= 85) return '✓ This content appears reliable and has few suspicious signals.';
    if (score >= 75) return '✓ Mostly authentic, but verify with trusted sources.';
    if (score >= 60) return '⚠️ Content has mixed indicators; cross-check before trusting.';
    if (score >= 40) return '⚠️ Several red flags detected; verify carefully before sharing.';
    if (score >= 20) return '✗ Likely misinformation; proceed with strong skepticism.';
    return '✗ Very likely false or misleading; treat as unverified information.';
}

function displayIndicators(analysis) {
    indicatorsList.innerHTML = '';
    if (analysis.detectedIndicators && analysis.detectedIndicators.length > 0) {
        analysis.detectedIndicators.forEach(indicator => {
            const li = document.createElement('li');
            li.className = 'detected';
            li.innerHTML = `<span class="indicator-icon">${indicator.icon}</span><span>${indicator.name}</span>`;
            indicatorsList.appendChild(li);
        });
    }
    if (analysis.passedIndicators && analysis.passedIndicators.length > 0) {
        analysis.passedIndicators.forEach(indicator => {
            const li = document.createElement('li');
            li.className = 'passed';
            li.innerHTML = `<span class="indicator-icon">${indicator.icon}</span><span>${indicator.name}</span>`;
            indicatorsList.appendChild(li);
        });
    }
    if (indicatorsList.children.length === 0) {
        const li = document.createElement('li');
        li.className = 'passed';
        li.innerHTML = '<span class="indicator-icon">✓</span><span>No major red flags detected.</span>';
        indicatorsList.appendChild(li);
    }
}

function startNewAnalysis() {
    newsInput.value = '';
    updateCharCount();
    resultSection.classList.add('hidden');
    newsInput.focus();
}

document.addEventListener('DOMContentLoaded', () => {
    updateCharCount();
    newsInput.focus();
});
