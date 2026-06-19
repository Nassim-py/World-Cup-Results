let data = null;

const fairPlay = { "Morocco": { yellow: 1, red: 0 }, "Brazil": { yellow: 2, red: 0 }, "Scotland": { yellow: 0, red: 0 }, "Haiti": { yellow: 1, red: 0 } };

function clean(name) { return name ? name.replace(/\s*\([^)]*\)\s*/g, '').trim() : ''; }

function getFair(team) { const d = fairPlay[team]; return d ? d.yellow + d.red * 2 : 0; }

function badges(team) {
    const d = fairPlay[team];
    if (!d || (d.yellow === 0 && d.red === 0)) return '';
    let b = [];
    if (d.yellow > 0) b.push(`<span class="badge yellow">🟨${d.yellow}</span>`);
    if (d.red > 0) b.push(`<span class="badge red">🟥${d.red}</span>`);
    return b.join(' ');
}

function result(match, team) {
    if (!match.score) return null;
    const t1 = clean(match.team1), t2 = clean(match.team2);
    const h = match.score.ft[0], a = match.score.ft[1];
    if (t1 === team) return h > a ? 'win' : h === a ? 'draw' : 'loss';
    if (t2 === team) return a > h ? 'win' : a === h ? 'draw' : 'loss';
    return null;
}

function goals(match, team) {
    const t1 = clean(match.team1), t2 = clean(match.team2);
    if (t1 === team) return match.goals1 || [];
    if (t2 === team) return match.goals2 || [];
    return [];
}

function oppGoals(match, team) {
    const t1 = clean(match.team1), t2 = clean(match.team2);
    if (t1 === team) return match.goals2 || [];
    if (t2 === team) return match.goals1 || [];
    return [];
}

async function fetchData() {
    try {
        const res = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json');
        data = await res.json();
        populateTeams();
    } catch (e) { alert('⚠️ Failed to load data. Please refresh.'); }
}

function populateTeams() {
    const realTeams = [
        'Algeria', 'Argentina', 'Australia', 'Austria', 'Belgium',
        'Bosnia & Herzegovina', 'Brazil', 'Canada', 'Cape Verde', 'Colombia',
        'Croatia', 'Curaçao', 'Czech Republic', 'DR Congo', 'Ecuador',
        'Egypt', 'England', 'France', 'Germany', 'Ghana',
        'Haiti', 'Iran', 'Iraq', 'Ivory Coast', 'Japan',
        'Jordan', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand',
        'Norway', 'Panama', 'Paraguay', 'Portugal', 'Qatar',
        'Saudi Arabia', 'Scotland', 'Senegal', 'South Africa', 'South Korea',
        'Spain', 'Sweden', 'Switzerland', 'Tunisia', 'Turkey',
        'USA', 'Uruguay', 'Uzbekistan'
    ];
    
    const sel = document.getElementById('teamSelect');
    while (sel.options.length > 1) sel.remove(1);
    
    realTeams.sort().forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        sel.appendChild(opt);
    });
        }

async function loadTeam() {
    const team = document.getElementById('teamSelect').value;
    if (!team) return alert('👀 Please select a team!');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    setTimeout(() => {
        try { update(team);
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
        } catch (e) {
            document.getElementById('loading').classList.add('hidden');
            alert('⚠️ Error loading team data.');
        }
    }, 600);
}

function update(team) {
    let group = null;
    for (let m of data.matches) {
        const t1 = clean(m.team1), t2 = clean(m.team2);
        if ((t1 === team || t2 === team) && m.group) { group = m.group; break; }
    }
    if (!group) return alert('⚠️ Team not found in group stage');

    const matches = data.matches.filter(m => m.group === group);
    const standings = {};

    matches.forEach(m => {
        if (m.score) {
            const home = clean(m.team1), away = clean(m.team2);
            const hg = m.score.ft[0], ag = m.score.ft[1];
            if (!standings[home]) standings[home] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
            if (!standings[away]) standings[away] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
            standings[home].p++; standings[home].gf += hg; standings[home].ga += ag;
            standings[away].p++; standings[away].gf += ag; standings[away].ga += hg;
            standings[home].gd = standings[home].gf - standings[home].ga;
            standings[away].gd = standings[away].gf - standings[away].ga;
            if (hg > ag) { standings[home].w++; standings[home].pts += 3; standings[away].l++; }
            else if (hg === ag) { standings[home].d++; standings[home].pts += 1; standings[away].d++; standings[away].pts += 1; }
            else { standings[home].l++; standings[away].w++; standings[away].pts += 3; }
        }
    });

    const sorted = Object.entries(standings).sort((a, b) => {
        if (a[1].pts !== b[1].pts) return b[1].pts - a[1].pts;
        if (a[1].gd !== b[1].gd) return b[1].gd - a[1].gd;
        if (a[1].gf !== b[1].gf) return b[1].gf - a[1].gf;
        const fA = getFair(a[0]), fB = getFair(b[0]);
        if (fA !== fB) return fA - fB;
        return a[0].localeCompare(b[0]);
    });

    const pos = sorted.findIndex(([t]) => t === team) + 1;
    const stats = standings[team] || { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };

    document.getElementById('teamName').textContent = team;
    document.getElementById('teamGroup').innerHTML = `<i class="fas fa-trophy"></i> Group <span>${group}</span>`;
    document.getElementById('teamPosition').textContent = `${pos}${suffix(pos)}`;
    document.getElementById('played').textContent = stats.p;
    document.getElementById('won').textContent = stats.w;
    document.getElementById('drawn').textContent = stats.d;
    document.getElementById('lost').textContent = stats.l;
    document.getElementById('points').textContent = stats.pts;

    renderTable(sorted, team);
    renderHistory(team);
    renderNext(team);
}

function renderTable(sorted, team) {
    const tbody = document.getElementById('standingsTable');
    tbody.innerHTML = '';
    sorted.forEach(([t, s], i) => {
        const row = tbody.insertRow();
        if (t === team) row.className = 'current';
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${t} ${t === team ? '⭐' : ''} ${badges(t)}</td>
            <td>${s.p}</td><td>${s.w}</td><td>${s.d}</td><td>${s.l}</td>
            <td>${s.gf}</td><td>${s.ga}</td>
            <td class="${s.gd > 0 ? 'green' : s.gd < 0 ? 'red' : ''}">${s.gd > 0 ? '+' : ''}${s.gd}</td>
            <td>${s.pts}</td>
        `;
    });
}

function renderHistory(team) {
    const container = document.getElementById('matchHistory');
    const matches = data.matches.filter(m => {
        const t1 = clean(m.team1), t2 = clean(m.team2);
        return t1 === team || t2 === team;
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    if (matches.length === 0) {
        container.innerHTML = '<p class="empty">No matches found</p>';
        return;
    }
    // ===== FULL RANKINGS TABLE =====
async function loadFullRankings() {
    const container = document.getElementById('rankingsTableContent');
    container.innerHTML = '<div class="loading">Loading rankings...</div>';
    
    try {
        // Fetch from your GitHub repo
        const response = await fetch('https://nassim-py.github.io/World-Cup-Results/rankings.json');
        
        if (!response.ok) {
            throw new Error('Failed to load rankings');
        }
        
        const rankings = await response.json();
        
        // Team flags mapping
        const flags = {
            'Argentina': '🇦🇷',
            'France': '🇫🇷',
            'Spain': '🇪🇸',
            'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
            'Brazil': '🇧🇷',
            'Morocco': '🇲🇦',
            'Portugal': '🇵🇹',
            'Netherlands': '🇳🇱',
            'Germany': '🇩🇪',
            'Belgium': '🇧🇪',
            'Uruguay': '🇺🇾',
            'Colombia': '🇨🇴',
            'Mexico': '🇲🇽',
            'USA': '🇺🇸',
            'Senegal': '🇸🇳',
            'Croatia': '🇭🇷',
            'Switzerland': '🇨🇭',
            'Japan': '🇯🇵',
            'Iran': '🇮🇷',
            'South Korea': '🇰🇷',
            'Australia': '🇦🇺',
            'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
            'Tunisia': '🇹🇳',
            'Algeria': '🇩🇿',
            'Egypt': '🇪🇬',
            'Nigeria': '🇳🇬',
            'Canada': '🇨🇦',
            'Norway': '🇳🇴',
            'Ivory Coast': '🇨🇮',
            'Paraguay': '🇵🇾',
            'Saudi Arabia': '🇸🇦',
            'Qatar': '🇶🇦',
            'Ghana': '🇬🇭',
            'Panama': '🇵🇦',
            'Cape Verde': '🇨🇻',
            'South Africa': '🇿🇦',
            'DR Congo': '🇨🇩',
            'Iraq': '🇮🇶',
            'Jordan': '🇯🇴',
            'Uzbekistan': '🇺🇿',
            'Curaçao': '🇨🇼',
            'Haiti': '🇭🇹',
            'New Zealand': '🇳🇿'
        };
        
        // Sort by rank
        const sortedTeams = Object.entries(rankings)
            .sort((a, b) => a[1] - b[1]);
        
        // Build table
        let html = `
            <table class="rankings-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th></th>
                        <th>Team</th>
                        <th style="text-align:right;">Points</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        sortedTeams.forEach(([team, rank]) => {
            const flag = flags[team] || '🏳️';
            const points = getPointsForRank(rank);
            const isTop3 = rank <= 3;
            const medalClass = rank === 1 ? 'rank-medal-1' : rank === 2 ? 'rank-medal-2' : rank === 3 ? 'rank-medal-3' : '';
            
            html += `
                <tr class="${isTop3 ? 'top-3' : ''}">
                    <td class="rank-num"><span class="${medalClass}">#${rank}</span></td>
                    <td class="rank-flag">${flag}</td>
                    <td class="rank-team">${team}</td>
                    <td class="rank-points">${points}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            <div style="text-align:center;margin-top:1rem;color:#6b7280;font-size:0.75rem;">
                <i class="fas fa-calendar"></i> Last updated: ${new Date().toLocaleDateString()}
            </div>
        `;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading rankings:', error);
        container.innerHTML = `
            <div style="text-align:center;padding:2rem;color:#6b7280;">
                <i class="fas fa-exclamation-circle" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>
                Unable to load rankings
            </div>
        `;
    }
}

// Helper function for points (approximate based on rank)
function getPointsForRank(rank) {
    const points = {
        1: 1889.06,
        2: 1887.11,
        3: 1856.03,
        4: 1847.68,
        5: 1765.34,
        6: 1755.62,
        7: 1755.09,
        8: 1749.20,
        9: 1743.54,
        10: 1733.93
    };
    return points[rank] || (1800 - rank * 5).toFixed(2);
}

// Toggle rankings table
function toggleRankings() {
    const wrap = document.getElementById('rankingsTableWrap');
    const btn = document.querySelector('.rankings-toggle button');
    
    if (wrap.classList.contains('show')) {
        wrap.classList.remove('show');
        btn.innerHTML = '<i class="fas fa-trophy"></i> Show Full FIFA Rankings';
    } else {
        wrap.classList.add('show');
        btn.innerHTML = '<i class="fas fa-times"></i> Hide Rankings';
        
        // Load rankings if not already loaded
        const container = document.getElementById('rankingsTableContent');
        if (container.innerHTML === '' || container.innerHTML.includes('Loading')) {
            loadFullRankings();
        }
    }
}

// Auto-load rankings when page loads (optional)
// Uncomment the line below if you want it to load automatically
// document.addEventListener('DOMContentLoaded', loadFullRankings);

    container.innerHTML = matches.map(m => {
        const t1 = clean(m.team1), t2 = clean(m.team2);
        const isHome = t1 === team;
        const opp = isHome ? t2 : t1;
        const res = result(m, team);
        const cls = res === 'win' ? 'win' : res === 'loss' ? 'loss' : 'draw';
        const emoji = res === 'win' ? '✅' : res === 'loss' ? '❌' : '➖';
        const label = res ? (res === 'win' ? 'Win' : res === 'loss' ? 'Loss' : 'Draw') : 'Upcoming';
        const score = m.score ? `${m.score.ft[0]} - ${m.score.ft[1]}` : 'vs';
        const g1 = goals(m, team), g2 = oppGoals(m, team);
        
        let goalsHtml = '';
        if (g1.length || g2.length) {
            goalsHtml = '<div class="goals">';
            if (g1.length) goalsHtml += `<div>⚽ ${team}: ${g1.map(g => `<span>${g.name}</span> <span class="min">${g.minute}'</span>${g.penalty ? ' <span class="pen">(P)</span>' : ''}`).join(', ')}</div>`;
            if (g2.length) goalsHtml += `<div>⚽ ${opp}: ${g2.map(g => `<span>${g.name}</span> <span class="min">${g.minute}'</span>${g.penalty ? ' <span class="pen">(P)</span>' : ''}`).join(', ')}</div>`;
            goalsHtml += '</div>';
        }

        return `
            <div class="match-card">
                <div class="top">
                    <div class="teams">
                        <span class="${isHome ? cls : ''}">${t1}</span>
                        <span class="vs">vs</span>
                        <span class="${!isHome ? cls : ''}">${t2}</span>
                        <span class="score">${score}</span>
                    </div>
                    <div class="badges">
                        <span class="round">${m.round || 'Match'}</span>
                        ${res ? `<span class="result ${cls}">${emoji} ${label}</span>` : '<span class="result upcoming">⏳ Upcoming</span>'}
                    </div>
                </div>
                ${goalsHtml}
                <div class="details">
                    <span><i class="fas fa-calendar"></i> ${m.date || 'TBD'}</span>
                    <span><i class="fas fa-clock"></i> ${m.time || 'TBD'}</span>
                    <span><i class="fas fa-location-dot"></i> ${m.ground || 'Venue TBD'}</span>
                    ${m.score && m.score.ht ? `<span><i class="fas fa-futbol"></i> HT: ${m.score.ht[0]} - ${m.score.ht[1]}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderNext(team) {
    const container = document.getElementById('nextMatch');
    const next = data.matches.find(m => {
        const t1 = clean(m.team1), t2 = clean(m.team2);
        return (t1 === team || t2 === team) && !m.score;
    });

    if (next) {
        const t1 = clean(next.team1), t2 = clean(next.team2);
        const opp = t1 === team ? t2 : t1;
        container.innerHTML = `
            <div class="next-content">
                <div>
                    <h4>${team} <span>vs</span> ${opp}</h4>
                    <div class="info">
                        <span><i class="fas fa-calendar"></i> ${next.date || 'TBD'}</span>
                        <span><i class="fas fa-clock"></i> ${next.time || 'TBD'}</span>
                        <span><i class="fas fa-location-dot"></i> ${next.ground || 'Venue TBD'}</span>
                        <span><i class="fas fa-tag"></i> ${next.round || 'Match'}</span>
                    </div>
                </div>
                <div class="timer"><i class="fas fa-hourglass-half"></i></div>
            </div>
        `;
    } else {
        container.innerHTML = '<div class="complete">🏆 Tournament Complete!</div>';
    }
}

function suffix(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

fetchData();
