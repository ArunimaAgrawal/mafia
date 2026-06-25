// Mafia Game Simulator - extracts logic from mafiaweb 10.html and runs automated games
const TOWN_ROLES = ['Villager','Doctor','Detective','Vigilante','Escort','ParanoidDoctor','DrunkDetective','Trapper','Watcher','Bodyguard','Mayor','Spy','InnocentTwin','Journalist','Herbalist'];
const NEUTRAL_KILLERS = ['SerialKiller','Phantom','Arsonist','PlagueDoctor','EvilTwin'];
const NEUTRAL_PASSIVE = ['Witch','Jester','Executioner','Survivor','GuardianAngel','Saboteur','Cursed','Amnesiac','Demon','Prophet','Gravedigger'];
const ALL_MAFIA_MEMBERS = ['Mafia','Godfather','Framer','Consigliere','Blackmailer','IdentityThief','Stalker'];
const MAFIA_GROUP_ROLES = ['Mafia','Godfather','IdentityThief','Stalker'];

const NIGHT_ORDER = [
    'Escort','Witch','Saboteur','Trapper','Framer','Consigliere','Blackmailer',
    'Mafia','SerialKiller','Phantom','Arsonist','PlagueDoctor','EvilTwin','Gravedigger','Prophet','Vigilante',
    'Bodyguard','GuardianAngel','Doctor','ParanoidDoctor','Survivor',
    'Detective','DrunkDetective','Spy','Watcher','Demon'
];

function shuffle(array) {
    let a = [...array];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

function initializeRoleState(p) {
    if (p.role === 'Executioner') p.executionerTarget = null; // set after
    if (p.role === 'GuardianAngel') p.guardianTarget = null;
    if (p.role === 'Survivor') p.survivorVests = 3;
    if (p.role === 'Trapper') p.trapperCharges = 2;
    if (p.role === 'Mayor') p.mayorRevealed = false;
    if (p.role === 'ParanoidDoctor') p.paranoidOutcome = null;
    if (p.role === 'Phantom') p.phantomDecoyUsed = false;
    if (p.role === 'Arsonist') p.dousedPlayers = [];
    if (p.role === 'Stalker') p.stalkerUsed = false;
    if (p.role === 'Saboteur') p.saboteurActive = true;
    if (p.role === 'Herbalist') { p.herbalistPotion = ['Heal','Reveal','Poison'][Math.floor(Math.random()*3)]; p.herbalistUsed = false; }
    if (p.role === 'Amnesiac') p.amnesiacUsed = false;
    if (p.role === 'Journalist') p.journalistUsed = false;
    if (p.role === 'Demon') { p.demonResurrectUsed = false; p.demonShuffleUsed = false; p.demonVoteUsed = false; }
}


function createGame(pool) {
    pool = shuffle(pool);
    let players = pool.map((role, i) => ({ id: 'p'+i, name: 'Player'+i, role, isAlive: true, isBot: true }));
    players.forEach(p => initializeRoleState(p));
    // Assign Executioner/GA targets
    players.forEach(p => {
        if (p.role === 'Executioner' || p.role === 'GuardianAngel') {
            let towns = players.filter(x => TOWN_ROLES.includes(x.role) && x.id !== p.id);
            if (towns.length === 0) towns = players.filter(x => x.id !== p.id);
            p[p.role === 'Executioner' ? 'executionerTarget' : 'guardianTarget'] = towns[Math.floor(Math.random()*towns.length)].id;
        }
    });
    return { players, dayCount: 0, daysWithoutDeaths: 0, dealtRoles: [...new Set(pool)], phantomReturns: [], IdentityThiefActive: false, log: [] };
}

function findPlayer(g, id) { return g.players.find(p => p.id === id); }
function findAliveRole(g, role) { return g.players.find(p => (p.role === role || (p.role === 'IdentityThief' && p.stolenRole === role)) && p.isAlive); }
function alive(g) { return g.players.filter(p => p.isAlive); }

function botPickTarget(g, bot, excludeSelf, excludeTeam) {
    let pool = alive(g).filter(p => p.id !== bot.id);
    if (excludeTeam === 'mafia') pool = pool.filter(p => !ALL_MAFIA_MEMBERS.includes(p.role));
    if (excludeTeam === 'town') pool = pool.filter(p => !TOWN_ROLES.includes(p.role));
    if (pool.length === 0) pool = alive(g).filter(p => p.id !== bot.id);
    return pool.length > 0 ? pool[Math.floor(Math.random()*pool.length)].id : null;
}

function generateNightActions(g) {
    let acts = {};
    let alivePlayers = alive(g);
    alivePlayers.forEach(p => {
        let activeRole = (p.role === 'IdentityThief' && p.stolenRole) ? p.stolenRole : p.role;
        let target = null;
        switch(activeRole) {
            case 'Villager': case 'Mayor': case 'Jester': case 'Executioner': case 'InnocentTwin': case 'Amnesiac': case 'Journalist': case 'Herbalist': case 'Cursed':
                break;
            case 'Doctor': case 'Bodyguard': case 'Escort': case 'Spy': case 'Watcher': case 'Saboteur':
            case 'Detective': case 'DrunkDetective':
                target = botPickTarget(g, p); break;
            case 'ParanoidDoctor':
                target = Math.random() < 0.3 ? p.id : botPickTarget(g, p); break;
            case 'Trapper':
                if (p.trapperCharges > 0) target = botPickTarget(g, p); break;
            case 'Vigilante':
                target = botPickTarget(g, p, true, 'town'); break;
            case 'Mafia': case 'Godfather': case 'IdentityThief':
                target = botPickTarget(g, p, true, 'mafia'); break;
            case 'Framer': case 'Consigliere': case 'Blackmailer':
                target = botPickTarget(g, p, true, 'mafia'); break;
            case 'SerialKiller':
                target = botPickTarget(g, p); break;
            case 'Survivor':
                if (p.survivorVests > 0) target = p.id; break;
            case 'GuardianAngel':
                target = p.guardianTarget; break;
            case 'Phantom':
                target = { action: 'kill', target: botPickTarget(g, p) }; break;
            case 'Arsonist':
                if ((p.dousedPlayers||[]).length >= 2 && Math.random() > 0.5) target = { action: 'ignite' };
                else target = { action: 'douse', target: botPickTarget(g, p) };
                break;
            case 'PlagueDoctor': case 'EvilTwin': case 'Prophet':
                target = botPickTarget(g, p); break;
            case 'Gravedigger':
                let dead = g.players.filter(x => !x.isAlive);
                target = { kill: botPickTarget(g, p), exhume: dead.length > 0 ? dead[Math.floor(Math.random()*dead.length)].id : null };
                break;
            case 'Witch':
                let others = alive(g).filter(x => x.id !== p.id);
                if (others.length >= 2) {
                    let puppet = others[Math.floor(Math.random()*others.length)];
                    let victims = others.filter(x => x.id !== puppet.id);
                    target = { puppetId: puppet.id, victimId: victims[Math.floor(Math.random()*victims.length)].id };
                }
                break;
            case 'Demon':
                if (!p.demonResurrectUsed) {
                    let dead = g.players.filter(x => !x.isAlive);
                    if (dead.length > 0) target = { action: 'resurrect', target: dead[Math.floor(Math.random()*dead.length)].id };
                } else if (!p.demonShuffleUsed) target = { action: 'shuffle' };
                break;
        }
        if (target !== null && target !== undefined) {
            let key = (p.role === 'IdentityThief' && p.stolenRole) ? p.stolenRole.toLowerCase() : p.role.toLowerCase();
            acts[key] = target;
            if (p.role === 'IdentityThief' && p.stolenRole) acts['identitythief'] = target;
        }
    });
    // Mafia kill priority
    if (!acts.godfather && !acts.mafia && !acts.identitythief) {
        let maf = alivePlayers.find(p => ALL_MAFIA_MEMBERS.includes(p.role));
        if (maf) { let t = botPickTarget(g, maf, true, 'mafia'); if (t) acts.mafia = t; }
    }
    return acts;
}


function convertCursedIfNeeded(g, deadRole) {
    if (ALL_MAFIA_MEMBERS.includes(deadRole)) {
        let c = g.players.find(p => p.role === 'Cursed' && p.isAlive);
        if (c) { c.role = 'Mafia'; c.cursedActivated = true; initializeRoleState(c); }
    }
}

function resolveNight(g) {
    g.dayCount++;
    let acts = generateNightActions(g);
    let kills = [], deaths = [];

    // Vigilante guilt from previous night
    g.players.forEach(p => {
        if (p.vigilanteGuilt && p.isAlive) { p.isAlive = false; p.vigilanteGuilt = false; deaths.push({ id: p.id, cause: 'guilt' }); }
    });

    let escortBlock = acts.escort || null;
    let witchAction = acts.witch || null;
    let escortPlayer = findAliveRole(g, 'Escort');
    if (!escortPlayer) escortBlock = null;
    let witchPlayer = findAliveRole(g, 'Witch');
    if (!witchPlayer) witchAction = null;
    if (escortPlayer && escortBlock === escortPlayer.id) escortBlock = null;
    if (witchPlayer && escortBlock === witchPlayer.id) witchAction = null;

    // Witch overrides
    if (witchAction && witchAction.puppetId && witchAction.victimId) {
        let puppet = findPlayer(g, witchAction.puppetId);
        if (puppet) {
            let roleLower = puppet.role.toLowerCase();
            if (puppet.role === 'Phantom') acts.phantom = { action: 'kill', target: witchAction.victimId };
            else if (puppet.role === 'Gravedigger') acts.gravedigger = { kill: witchAction.victimId, exhume: null };
            else if (puppet.role === 'Demon') acts.demon = { action: 'resurrect', target: witchAction.victimId };
            else {
                if (ALL_MAFIA_MEMBERS.includes(puppet.role)) {
                    if (puppet.role === 'Godfather') acts.godfather = witchAction.victimId;
                    else acts.mafia = witchAction.victimId;
                }
                acts[roleLower] = witchAction.victimId;
            }
        }
    }

    const isBlocked = (pid) => pid === escortBlock;

    // Saboteur
    if (acts.saboteur) {
        let sp = findAliveRole(g, 'Saboteur');
        if (sp && !isBlocked(sp.id)) { let t = findPlayer(g, acts.saboteur); if (t && t.isAlive) t.sabotaged = true; }
    }

    // Framer
    let framedTarget = null;
    let framerPlayer = findAliveRole(g, 'Framer');
    if (framerPlayer && !isBlocked(framerPlayer.id) && acts.framer) framedTarget = acts.framer;

    // Trapper
    let trapTarget = null;
    let trapperPlayer = findAliveRole(g, 'Trapper');
    if (trapperPlayer && !isBlocked(trapperPlayer.id) && acts.trapper && trapperPlayer.trapperCharges > 0) {
        trapTarget = acts.trapper; trapperPlayer.trapperCharges--;
    }

    // Blackmailer
    if (acts.blackmailer) {
        let bp = findAliveRole(g, 'Blackmailer');
        if (bp && !isBlocked(bp.id)) { let t = findPlayer(g, acts.blackmailer); if (t) t.blackmailed = true; }
    }

    // IdentityThief active
    let itPlayer = findAliveRole(g, 'IdentityThief');
    g.IdentityThiefActive = !!(itPlayer && !isBlocked(itPlayer.id));

    // Mafia kill
    let mafiaTarget = acts.godfather || acts.mafia || acts.identitythief;
    if (mafiaTarget) {
        let executor = findAliveRole(g,'Godfather') || findAliveRole(g,'Mafia') || findAliveRole(g,'IdentityThief');
        if (executor && !isBlocked(executor.id)) kills.push({ victimId: mafiaTarget, killer: 'Mafia', killerId: executor.id });
    }

    // Serial Killer
    if (acts.serialkiller) {
        let skp = findAliveRole(g, 'SerialKiller');
        if (skp) kills.push({ victimId: acts.serialkiller, killer: 'SerialKiller', killerId: skp.id });
    }

    // Escort dies to SK/ParanoidDoctor
    if (acts.escort && escortPlayer && !isBlocked(escortPlayer.id)) {
        let t = findPlayer(g, acts.escort);
        if (t && t.role === 'SerialKiller') kills.push({ victimId: escortPlayer.id, killer: 'SerialKiller', killerId: t.id, unstoppable: true });
        else if (t && t.role === 'ParanoidDoctor' && Math.random() < 0.5) kills.push({ victimId: escortPlayer.id, killer: 'ParanoidDoctor', killerId: t.id, unstoppable: true });
    }
    // Doctor dies to SK
    if (acts.doctor) {
        let dp = findAliveRole(g, 'Doctor');
        if (dp && !isBlocked(dp.id)) { let t = findPlayer(g, acts.doctor); if (t && t.role === 'SerialKiller') kills.push({ victimId: dp.id, killer: 'SerialKiller', killerId: t.id, unstoppable: true }); }
    }
    // Detective dies to SK
    if (acts.detective) {
        let dp = findAliveRole(g, 'Detective');
        if (dp && !isBlocked(dp.id)) { let t = findPlayer(g, acts.detective); if (t && t.role === 'SerialKiller') { kills.push({ victimId: dp.id, killer: 'SerialKiller', killerId: t.id, unstoppable: true }); acts.detective = null; } }
    }

    // Phantom
    if (acts.phantom) {
        let pp = findAliveRole(g, 'Phantom');
        if (pp && !isBlocked(pp.id)) {
            let a = typeof acts.phantom === 'object' ? acts.phantom : { action: 'kill', target: acts.phantom };
            if (a.action === 'decoy' && !pp.phantomDecoyUsed && a.target) { pp.phantomDecoyUsed = true; let t = findPlayer(g, a.target); if (t) t.fakeDeceased = true; }
            else if (a.target) kills.push({ victimId: a.target, killer: 'Phantom', killerId: pp.id });
        }
    }

    // Arsonist
    if (acts.arsonist) {
        let ap = findAliveRole(g, 'Arsonist');
        if (ap && !isBlocked(ap.id)) {
            let a = typeof acts.arsonist === 'object' ? acts.arsonist : { action: 'douse', target: acts.arsonist };
            if (a.action === 'ignite') {
                (ap.dousedPlayers||[]).forEach(dpId => { let dp = findPlayer(g, dpId); if (dp && dp.isAlive) kills.push({ victimId: dpId, killer: 'Arsonist', killerId: ap.id, unstoppable: true }); });
                ap.dousedPlayers = [];
            } else if (a.target) { ap.dousedPlayers = ap.dousedPlayers||[]; if (!ap.dousedPlayers.includes(a.target)) ap.dousedPlayers.push(a.target); }
        }
    }

    // Plague Doctor infections dying
    g.players.forEach(p => { if (p.isAlive && p.infectedNight && (g.dayCount - p.infectedNight >= 2)) { kills.push({ victimId: p.id, killer: 'Plague', killerId: null }); delete p.infectedNight; } });
    if (acts.plaguedoctor) {
        let pdp = findAliveRole(g, 'PlagueDoctor');
        if (pdp && !isBlocked(pdp.id)) { let t = findPlayer(g, acts.plaguedoctor); if (t && t.isAlive && !t.infectedNight) t.infectedNight = g.dayCount; }
    }

    // Evil Twin
    if (acts.eviltwin) {
        let etp = findAliveRole(g, 'EvilTwin');
        if (etp) {
            let isEnraged = etp.enragedImmunityDay === g.dayCount;
            if (!isBlocked(etp.id) || isEnraged) kills.push({ victimId: acts.eviltwin, killer: 'EvilTwin', killerId: etp.id, unstoppable: isEnraged });
        }
    }

    // Gravedigger
    if (acts.gravedigger) {
        let gp = findAliveRole(g, 'Gravedigger');
        if (gp && !isBlocked(gp.id)) {
            let a = typeof acts.gravedigger === 'object' ? acts.gravedigger : { kill: acts.gravedigger };
            if (a.kill) kills.push({ victimId: a.kill, killer: 'Gravedigger', killerId: gp.id });
        }
    }

    // Prophet prediction
    if (acts.prophet) { let prop = findAliveRole(g, 'Prophet'); if (prop && !isBlocked(prop.id)) prop.prophetPrediction = acts.prophet; }

    // Vigilante
    if (acts.vigilante && acts.vigilante !== 'skip') {
        let vp = findAliveRole(g, 'Vigilante');
        if (vp && !isBlocked(vp.id)) kills.push({ victimId: acts.vigilante, killer: 'Vigilante', killerId: vp.id });
    }

    // Paranoid Doctor
    if (acts.paranoiddoctor) {
        let pdp = findAliveRole(g, 'ParanoidDoctor');
        if (pdp && !isBlocked(pdp.id)) {
            if (acts.paranoiddoctor !== pdp.id) {
                pdp.paranoidOutcome = Math.random() < 0.5 ? 'save' : 'kill';
                if (pdp.paranoidOutcome === 'kill') kills.push({ victimId: acts.paranoiddoctor, killer: 'ParanoidDoctor', killerId: pdp.id });
            } else { pdp.paranoidOutcome = 'save'; }
        }
    }

    // PROTECTION PHASE
    // Trapper
    if (trapTarget) {
        kills = kills.filter(k => {
            if (k.victimId === trapTarget && k.killerId && !k.unstoppable) {
                let killer = findPlayer(g, k.killerId);
                if (killer && killer.isAlive && !deaths.some(d => d.id === killer.id)) {
                    if (ALL_MAFIA_MEMBERS.includes(killer.role) || NEUTRAL_KILLERS.includes(killer.role)) {
                        killer.isAlive = false; convertCursedIfNeeded(g, killer.role); deaths.push({ id: killer.id, cause: 'trapped' });
                    }
                }
                return false;
            }
            return true;
        });
    }

    // Bodyguard
    if (acts.bodyguard) {
        let bgp = findAliveRole(g, 'Bodyguard');
        if (bgp && !isBlocked(bgp.id) && acts.bodyguard !== bgp.id) {
            kills = kills.filter(k => {
                if (k.victimId === acts.bodyguard) {
                    if (!deaths.some(d => d.id === bgp.id)) { bgp.isAlive = false; convertCursedIfNeeded(g, bgp.role); deaths.push({ id: bgp.id, cause: 'bodyguard' }); }
                    return false;
                }
                return true;
            });
        }
    }

    // Guardian Angel
    if (acts.guardianangel) {
        let gap = findAliveRole(g, 'GuardianAngel');
        if (gap && !isBlocked(gap.id) && gap.guardianTarget) {
            kills = kills.filter(k => k.unstoppable || k.victimId !== gap.guardianTarget);
        }
    }

    // Doctor heal
    let healedTarget = null;
    let docPlayer = findAliveRole(g, 'Doctor');
    if (docPlayer && !isBlocked(docPlayer.id) && acts.doctor) {
        healedTarget = acts.doctor;
        let t = findPlayer(g, healedTarget); if (t && t.infectedNight) delete t.infectedNight;
    }

    // Paranoid Doctor save
    let paranoidSave = null;
    let pdPlayer = findAliveRole(g, 'ParanoidDoctor');
    if (pdPlayer && !isBlocked(pdPlayer.id) && pdPlayer.paranoidOutcome === 'save' && acts.paranoiddoctor) paranoidSave = acts.paranoiddoctor;

    // Survivor vest
    let survivorVested = {};
    g.players.forEach(p => { if (p.role === 'Survivor' && p.isAlive && acts.survivor === p.id && p.survivorVests > 0) { survivorVested[p.id] = true; p.survivorVests--; } });

    // Process kills
    kills.forEach(k => {
        if (!k.unstoppable) {
            if (k.victimId === healedTarget) return;
            if (k.victimId === paranoidSave) return;
            if (survivorVested[k.victimId]) return;
        }
        let victim = findPlayer(g, k.victimId);
        if (victim && victim.role === 'Prophet' && victim.prophetAscended) return;
        if (victim && victim.role === 'Demon') return;
        if (victim && victim.role === 'EvilTwin' && victim.enragedImmunityDay === g.dayCount) return;
        if (victim && victim.isAlive && !deaths.some(d => d.id === victim.id)) {
            victim.isAlive = false;
            convertCursedIfNeeded(g, victim.role);
            deaths.push({ id: victim.id, cause: k.killer });
            if (k.killer === 'Mafia' && g.IdentityThiefActive) {
                let it = g.players.find(p => p.role === 'IdentityThief' && p.isAlive);
                if (it && !it.stolenRole && victim.role !== 'Villager' && victim.role !== 'Mayor') it.stolenRole = victim.role;
            }
            if (k.killer === 'Vigilante' && TOWN_ROLES.includes(victim.role)) {
                let vig = findAliveRole(g, 'Vigilante'); if (vig) vig.vigilanteGuilt = true;
            }
        }
    });

    // Prophet ascension check
    let prophet = g.players.find(p => p.role === 'Prophet' && p.isAlive && p.prophetPrediction);
    if (prophet) { if (!prophet.prophetAscended && deaths.some(d => d.id === prophet.prophetPrediction)) prophet.prophetAscended = true; prophet.prophetPrediction = null; }

    // Demon actions
    if (acts.demon) {
        let dp = findAliveRole(g, 'Demon');
        if (dp && !isBlocked(dp.id) && typeof acts.demon === 'object') {
            if (acts.demon.action === 'resurrect' && !dp.demonResurrectUsed) {
                let dead = findPlayer(g, acts.demon.target);
                if (dead && !dead.isAlive) { dead.isAlive = true; dp.demonResurrectUsed = true; }
            } else if (acts.demon.action === 'shuffle' && !dp.demonShuffleUsed) {
                let shufflers = g.players.filter(p => p.isAlive && p.role !== 'Demon');
                let roles = shufflers.map(p => p.role);
                for (let i = roles.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [roles[i],roles[j]]=[roles[j],roles[i]]; }
                shufflers.forEach((p,idx) => { p.role = roles[idx]; initializeRoleState(p); });
                dp.demonShuffleUsed = true;
            }
        }
    }

    // Executioner target dies at night -> becomes Jester
    g.players.forEach(p => {
        if (p.role === 'Executioner' && p.isAlive && p.executionerTarget) {
            let t = findPlayer(g, p.executionerTarget);
            if (t && !t.isAlive) { p.role = 'Jester'; delete p.executionerTarget; }
        }
    });

    // Phantom returns
    g.players.forEach(p => { if (p.fakeDeceased) { p.fakeDeceased = false; p.isAlive = true; } });

    g.dealtRoles = [...new Set(g.players.map(p => p.role))];
    return deaths;
}


function checkWin(g) {
    let al = alive(g);
    if (al.length === 0) return 'DRAW';
    let mafia = al.filter(p => ALL_MAFIA_MEMBERS.includes(p.role)).length;
    let sk = al.filter(p => NEUTRAL_KILLERS.includes(p.role)).length;
    let town = al.filter(p => TOWN_ROLES.includes(p.role)).length;
    let neutral = al.filter(p => NEUTRAL_PASSIVE.includes(p.role)).length;

    if (mafia === 0 && sk === 0) return 'TOWN_WIN';
    if (mafia >= (town + neutral + sk) && sk === 0) return 'MAFIA_WIN';
    if (sk >= town + neutral + mafia && mafia === 0) return 'SK_WIN';
    if (g.daysWithoutDeaths >= 3) return 'STALEMATE';
    if (g.dayCount >= 5) {
        let sab = al.find(p => p.role === 'Saboteur');
        if (sab && al.some(p => ALL_MAFIA_MEMBERS.includes(p.role))) return 'SABOTEUR_WIN';
    }
    return null;
}

function simulateVote(g) {
    let al = alive(g).filter(p => !p.blackmailed && !p.sabotaged && !p.demonSilenced);
    if (al.length < 2) return null;
    // Random voting: each alive player votes randomly
    let votes = {};
    al.forEach(p => {
        let targets = alive(g).filter(x => x.id !== p.id);
        if (targets.length === 0) return;
        let t = targets[Math.floor(Math.random()*targets.length)];
        let weight = p.mayorRevealed ? 3 : 1;
        votes[t.id] = (votes[t.id]||0) + weight;
    });
    let max = 0, targetId = null, tie = false;
    for (let id in votes) {
        if (votes[id] > max) { max = votes[id]; targetId = id; tie = false; }
        else if (votes[id] === max) tie = true;
    }
    if (tie || max === 0) return null;
    return targetId;
}

function simulateDay(g) {
    let voteTarget = simulateVote(g);
    if (voteTarget) {
        let p = findPlayer(g, voteTarget);
        if (p) {
            p.isAlive = false;
            convertCursedIfNeeded(g, p.role);
            // Jester win
            if (p.role === 'Jester') return 'JESTER_WIN';
            // Executioner win (check)
            let exec = g.players.find(x => x.role === 'Executioner' && x.isAlive && x.executionerTarget === p.id);
            if (exec) { /* exec wins but game may continue */ }
            // InnocentTwin lynched -> EvilTwin enraged
            if (p.role === 'InnocentTwin') {
                let et = g.players.find(x => x.role === 'EvilTwin' && x.isAlive);
                if (et) et.enragedImmunityDay = g.dayCount;
            }
            g.deathsSinceDay = 1;
        }
    } else {
        g.deathsSinceDay = 0;
    }
    // Clear day flags
    g.players.forEach(p => { p.blackmailed = false; p.sabotaged = false; p.demonSilenced = false; p.voteTarget = null; });
    return null;
}

function runGame(pool, verbose) {
    let g = createGame(pool);
    let maxRounds = 20;
    let result = null;

    if (verbose) g.log.push(`Roles: ${g.players.map(p => p.name+'='+p.role).join(', ')}`);

    for (let round = 0; round < maxRounds; round++) {
        // Night
        let deaths = resolveNight(g);
        if (verbose && deaths.length > 0) g.log.push(`Night ${g.dayCount}: ${deaths.map(d => findPlayer(g,d.id).name+'('+findPlayer(g,d.id).role+') killed by '+d.cause).join(', ')}`);

        result = checkWin(g);
        if (result) break;

        // Day vote
        let dayResult = simulateDay(g);
        if (dayResult) { result = dayResult; break; }

        result = checkWin(g);
        if (result) break;

        // Track stalemate
        if (deaths.length === 0 && !g.deathsSinceDay) g.daysWithoutDeaths++;
        else g.daysWithoutDeaths = 0;
    }

    if (!result) result = 'TIMEOUT';
    if (verbose) g.log.push(`Result: ${result} (Day ${g.dayCount}, ${alive(g).length} alive: ${alive(g).map(p=>p.role).join(',')})`);
    return { result, dayCount: g.dayCount, alive: alive(g).map(p=>p.role), log: g.log };
}

// ═══════════════════════════════════════════════════════
// RUN SIMULATIONS
// ═══════════════════════════════════════════════════════
const COMPOSITIONS = [
    { name: 'Godfather+SK+Jester+Survivor', pool: ['Godfather','SerialKiller','Jester','Survivor','Doctor','Detective','Villager'] },
    { name: 'Mafia+Witch+Executioner+Arsonist', pool: ['Mafia','Witch','Executioner','Arsonist','Doctor','Vigilante','Villager'] },
    { name: 'Godfather+Phantom+Saboteur+Cursed', pool: ['Godfather','Phantom','Saboteur','Cursed','Doctor','Detective','Trapper'] },
    { name: 'Mafia+SK+Jester+Demon', pool: ['Mafia','SerialKiller','Jester','Demon','Doctor','Escort','Villager'] },
    { name: 'Godfather+EvilTwin+Prophet+Survivor', pool: ['Godfather','EvilTwin','Prophet','Survivor','Detective','Bodyguard','InnocentTwin'] },
    { name: 'Mafia+Gravedigger+Witch+PlagueDoctor', pool: ['Mafia','Gravedigger','Witch','PlagueDoctor','Doctor','Vigilante','Villager'] },
    { name: 'Consigliere+SK+Executioner+GuardianAngel', pool: ['Consigliere','SerialKiller','Executioner','GuardianAngel','Doctor','Detective','Villager'] },
    { name: 'Godfather+Arsonist+Saboteur+Jester', pool: ['Godfather','Arsonist','Saboteur','Jester','ParanoidDoctor','Spy','Mayor'] },
];

const NUM_GAMES = 200;
let stats = {};
let issues = [];

console.log(`\n=== MAFIA GAME SIMULATOR ===`);
console.log(`Running ${NUM_GAMES} games per composition (${COMPOSITIONS.length} compositions)\n`);

COMPOSITIONS.forEach(comp => {
    stats[comp.name] = { total: 0, results: {}, avgDays: 0, timeouts: 0 };
    let totalDays = 0;
    let sampleLogs = [];

    for (let i = 0; i < NUM_GAMES; i++) {
        let verbose = i < 3; // log first 3 games
        let game = runGame(comp.pool, verbose);
        stats[comp.name].total++;
        stats[comp.name].results[game.result] = (stats[comp.name].results[game.result]||0) + 1;
        totalDays += game.dayCount;
        if (game.result === 'TIMEOUT') stats[comp.name].timeouts++;
        if (verbose) sampleLogs.push(game.log);

        // Detect issues
        if (game.dayCount >= 18) issues.push({ comp: comp.name, issue: `Game lasted ${game.dayCount} days - possible infinite loop`, log: game.log });
        if (game.result === 'TIMEOUT') {
            if (i < 5) issues.push({ comp: comp.name, issue: `TIMEOUT: game never ended`, alive: game.alive });
        }
    }

    stats[comp.name].avgDays = (totalDays / NUM_GAMES).toFixed(1);

    console.log(`--- ${comp.name} ---`);
    console.log(`  Avg days: ${stats[comp.name].avgDays} | Timeouts: ${stats[comp.name].timeouts}/${NUM_GAMES}`);
    let results = Object.entries(stats[comp.name].results).sort((a,b) => b[1]-a[1]);
    results.forEach(([r, c]) => console.log(`  ${r}: ${c} (${(c/NUM_GAMES*100).toFixed(0)}%)`));

    if (sampleLogs.length > 0) {
        console.log(`  Sample game:`);
        sampleLogs[0].forEach(l => console.log(`    ${l}`));
    }
    console.log('');
});

// Report issues
if (issues.length > 0) {
    console.log(`\n=== ISSUES FOUND (${issues.length}) ===`);
    let uniqueIssues = {};
    issues.forEach(i => {
        let key = i.comp + '|' + i.issue;
        if (!uniqueIssues[key]) { uniqueIssues[key] = { ...i, count: 1 }; }
        else uniqueIssues[key].count++;
    });
    Object.values(uniqueIssues).forEach(i => {
        console.log(`  [${i.comp}] ${i.issue} (x${i.count})`);
        if (i.alive) console.log(`    Alive: ${i.alive.join(', ')}`);
    });
}

// Overall analysis
console.log(`\n=== BALANCE ANALYSIS ===`);
let allResults = {};
Object.values(stats).forEach(s => {
    Object.entries(s.results).forEach(([r,c]) => { allResults[r] = (allResults[r]||0) + c; });
});
let totalGames = Object.values(allResults).reduce((a,b)=>a+b, 0);
Object.entries(allResults).sort((a,b)=>b[1]-a[1]).forEach(([r,c]) => {
    console.log(`  ${r}: ${c}/${totalGames} (${(c/totalGames*100).toFixed(1)}%)`);
});

let totalTimeouts = Object.values(stats).reduce((a,s) => a + s.timeouts, 0);
if (totalTimeouts > totalGames * 0.1) {
    console.log(`\n  WARNING: ${(totalTimeouts/totalGames*100).toFixed(0)}% games timed out - possible logic bug!`);
}
