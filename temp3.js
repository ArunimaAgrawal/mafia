
/* ==========================================================================
   FIREBASE IMPORT & CONFIG
   ========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, update, push, onValue, onChildAdded, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9M0zi0wvyZ6UcSvzNOKA5-xJxYDt89f8",
  authDomain: "mafia-web-71234.firebaseapp.com",
  databaseURL: "https://mafia-web-71234-default-rtdb.firebaseio.com", 
  projectId: "mafia-web-71234",
  storageBucket: "mafia-web-71234.firebasestorage.app",
  messagingSenderId: "384396811392",
  appId: "1:384396811392:web:9aacdb43430b7913891a65"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

/* ==========================================================================
   GAME CONFIG & 34 ROLES
   ========================================================================== */
const TEAM_COLORS = { Town: 'var(--gold)', Mafia: 'var(--blood)', Neutral: 'var(--neutral)' };

const ROLES = {
    // ── TOWN BASE ──
    Villager:    { team:'Town', name:'Villager', desc:'Find and eliminate the Mafia during the day.', win:'All Mafia/Evils are eliminated.' },
    Doctor:      { team:'Town', name:'Doctor', desc:'Protect one player from death. Healing a Serial Killer gets you killed.', win:'All Mafia/Evils are eliminated.' },
    Detective:   { team:'Town', name:'Detective', desc:'Investigate one player. Investigating a Serial Killer gets you killed.', win:'All Mafia/Evils are eliminated.' },
    Vigilante:   { team:'Town', name:'Vigilante', desc:'Shoot someone at night. If they are Town, you die of guilt the next night.', win:'All Mafia/Evils are eliminated.' },
    Escort:      { team:'Town', name:'Escort', desc:'Block a player. Blocking a Serial Killer or Paranoid Doctor may get you killed.', win:'All Mafia/Evils are eliminated.' },
    // ── TOWN VARIANTS ──
    Bodyguard:      { team:'Town', name:'Bodyguard', desc:'Guard a player. If anyone targets them with a kill, you die instead and the kill is cancelled.', win:'All Mafia/Evils are eliminated.', variant:true, replacesLabel:'Doctor' },
    Mayor:          { team:'Town', name:'Mayor', desc:'No night action. Reveal during the day — your vote counts as 3.', win:'All Mafia/Evils are eliminated.', variant:true, replacesLabel:'Villager' },
    Spy:            { team:'Town', name:'Spy', desc:'Plant a bug in a player\'s house at night. Learn the roles of anyone who visits them.', win:'All Mafia/Evils are eliminated.', variant:true, replacesLabel:'Detective' },
    Watcher:        { team:'Town', name:'Watcher', desc:'Watch a player at night. See the names of everyone who visits them.', win:'All Mafia/Evils are eliminated.', variant:true, replacesLabel:'Detective' },
    DrunkDetective: { team:'Town', name:'Drunk Detective', desc:'Investigate like Detective, but results are randomly wrong 50% of the time.', win:'All Mafia/Evils are eliminated.', variant:true, replacesLabel:'Detective' },
    ParanoidDoctor: { team:'Town', name:'Paranoid Doctor', desc:'Target a player: 50% to save them, 50% to kill them. You never know which happened. Target yourself to do nothing.', win:'All Mafia/Evils are eliminated.', variant:true, replacesLabel:'Doctor' },
    Trapper:        { team:'Town', name:'Trapper', desc:'Trap a player (not yourself). If a killer targets them, the killer dies instead. 2 charges.', win:'All Mafia/Evils are eliminated.', variant:true, replacesLabel:'Vigilante' },
    Journalist:  { team:'Town', name:'Journalist', desc:'Publish an exposé during the day. Guess a player\'s role to permanently reveal it. If wrong, you resign in disgrace.', win:'All Mafia/Evils are eliminated.', variant:true, replacesLabel:'Mayor' },
    Herbalist:   { team:'Town', name:'Herbalist', desc:'Start with a random potion (Heal, Reveal, Poison). Use it once during any Day phase.', win:'All Mafia/Evils are eliminated.', variant:true, replacesLabel:'Doctor' },
    // ── MAFIA BASE ──
    Mafia:     { team:'Mafia', name:'Mafia', desc:'Secretly eliminate one player each night with your team.', win:'Mafia outnumbers the Town.' },
    Godfather: { team:'Mafia', name:'Godfather', desc:'Lead the Mafia. You appear innocent to the Detective.', win:'Mafia outnumbers the Town.' },
    Framer:    { team:'Mafia', name:'Framer', desc:'Frame a player at night — they appear suspicious to the Detective.', win:'Mafia outnumbers the Town.' },
    // ── MAFIA VARIANTS ──
    Consigliere: { team:'Mafia', name:'Consigliere', desc:'Investigate a player at night to learn their exact role.', win:'Mafia outnumbers the Town.', variant:true, replacesLabel:'Framer' },
    Blackmailer: { team:'Mafia', name:'Blackmailer', desc:'Learn a player\'s role at night and silence their vote next day.', win:'Mafia outnumbers the Town.', variant:true, replacesLabel:'Framer' },
    IdentityThief:     { team:'Mafia', name:'IdentityThief', desc:'If alive, Mafia kills are "cleaned" — victim\'s role hidden at dawn. You learn it privately.', win:'Mafia outnumbers the Town.', variant:true, replacesLabel:'Mafia' },
    // ── NEUTRAL BASE ──
    Jester:       { team:'Neutral', name:'Jester', desc:'Trick the town into voting you out during the day.', win:'Get eliminated by the daytime vote.' },
    Witch:        { team:'Neutral', name:'Witch', desc:'Control a player at night, forcing them to visit a second target.', win:'Survive to see the Town lose.' },
    SerialKiller: { team:'Neutral', name:'Serial Killer', desc:'Kill one player per night. Kills anyone who targets them with Town investigative/support roles.', win:'Be the last player standing.' },
    // ── NEUTRAL VARIANTS ──
    Executioner:   { team:'Neutral', name:'Executioner', desc:'Get your secret target voted out. If they die at night, you become the Jester.', win:'Target eliminated by vote.', variant:true, replacesLabel:'Jester' },
    Survivor:      { team:'Neutral', name:'Survivor', desc:'Use vests (3 charges) to survive kills. Win if alive at game end.', win:'Be alive when the game ends.', variant:true, replacesLabel:'Witch' },
    GuardianAngel: { team:'Neutral', name:'Guardian Angel', desc:'Protect your assigned ward each night. Win if they survive the game.', win:'Your ward survives.', variant:true, replacesLabel:'Witch' },
    // ── NEW NEUTRAL ROLES ──
    Saboteur:    { team:'Neutral', name:'Saboteur', desc:'Silence a player\'s vote each night. Win if the game reaches Night 5 with Mafia alive.', win:'Game reaches Night 5.' },
    Phantom:     { team:'Neutral', name:'Phantom', desc:'Kill one player per night. Once per game, plant a decoy — fake a player\'s death. They return the next night.', win:'Be the last standing.' },
    Arsonist:    { team:'Neutral', name:'Arsonist', desc:'Douse players at night. Choose to ignite — all doused players die at once. Escort blocking ignite cancels all.', win:'Be the last standing.' },
    PlagueDoctor:{ team:'Neutral', name:'Plague Doctor', desc:'Infect a player at night. They die 2 nights later unless the Doctor cures them.', win:'Plague the town.' },
    Prophet:     { team:'Neutral', name:'Prophet', desc:'Predict who will die each night. If you guess right, you ascend and gain night immunity.', win:'Predict a death, then survive.' },
    Twin:        { team:'Neutral', name:'Twin', desc:'Paired role: one evil (kills at night), one innocent (Town). Both know each other. Add 2 to pool.', win:'Depends on alignment.' },
    EvilTwin:    { team:'Neutral', name:'Evil Twin', desc:'Kill one player per night. If the Innocent Twin is lynched, you become Enraged (invincible + unstoppable attack).', win:'Survive when Town falls.', _internal:true },
    InnocentTwin:{ team:'Town', name:'Innocent Twin', desc:'You know the Evil Twin\'s identity. If you are voted out, the Evil Twin becomes Enraged.', win:'All Mafia/Evils are eliminated.', _internal:true },
    Gravedigger: { team:'Neutral', name:'Gravedigger', desc:'Kill one player and exhume one dead player each night to learn their role.', win:'Be the last standing.' },
    Cursed:      { team:'Neutral', name:'Cursed', desc:'Secretly becomes the next villain if the current villain dies. Wins with Town if never activated.', win:'Take over as Mafia or win with Town.' },
    Amnesiac:    { team:'Neutral', name:'Amnesiac', desc:'Starts with no role. Once per game during Day, inherit a dead player\'s role.', win:'Same as inherited role.' },
    Demon:       { team:'Neutral', name:'Demon', desc:'Unkillable at night. You have 3 powers (1 use each): Resurrect (Night), Shuffle Roles (Night), and Silence a player (Day).', win:'Survive and use all 3 powers.', variant:true, replacesLabel:'Jester' }
};

const TOWN_ROLES  = ['Villager','Doctor','Detective','Vigilante','Escort','ParanoidDoctor','DrunkDetective','Trapper','Watcher','Bodyguard','Mayor','Spy','InnocentTwin','Journalist','Herbalist'];
const NEUTRAL_KILLERS = ['SerialKiller','Phantom','Arsonist','PlagueDoctor','Prophet','EvilTwin','Gravedigger'];
const NEUTRAL_PASSIVE = ['Witch','Jester','Executioner','Survivor','GuardianAngel','Saboteur','Cursed','Amnesiac','Demon'];
const ALL_MAFIA_MEMBERS = ['Mafia','Godfather','Framer','Consigliere','Blackmailer','IdentityThief','Stalker'];

const NIGHT_ORDER = [
    'Escort','Witch','Saboteur','Trapper','Framer','Consigliere','Blackmailer',
    'Mafia','SerialKiller','Phantom','Arsonist','PlagueDoctor','EvilTwin','Gravedigger','Prophet','Vigilante',
    'Bodyguard','GuardianAngel','Doctor','ParanoidDoctor','Survivor',
    'Detective','DrunkDetective','Stalker','Spy','Watcher',
    'Demon'
];

const MAFIA_GROUP_ROLES = ['Mafia','Godfather','IdentityThief','Stalker'];

const PRESETS = {
    'Simple':   ['Villager','Mafia'],
    'Standard': ['Villager','Villager','Mafia','Doctor','Detective'],
    'Full':     ['Villager','Villager','Mafia','Godfather','Doctor','Detective','Jester','Vigilante'],
    'Spicy':    ['Villager','Villager','Mafia','Consigliere','Bodyguard','DrunkDetective','Executioner','Trapper'],
    'Chaos':    ['Villager','Villager','Mafia','Godfather','IdentityThief','Doctor','ParanoidDoctor','Watcher','Spy','Jester','Executioner','Survivor','SerialKiller'],
};

// Roles shown in pool builder (hide internal-only roles)
const POOL_ROLES_ORDERED = {
    Town: ['Villager','Doctor','Detective','Vigilante','Escort','Bodyguard','Mayor','Spy','Watcher','DrunkDetective','ParanoidDoctor','Trapper','Journalist','Herbalist'],
    Mafia: ['Mafia','Godfather','Framer','Consigliere','Blackmailer','IdentityThief','Stalker'],
    Neutral: ['Jester','Witch','SerialKiller','Executioner','Survivor','GuardianAngel','Saboteur','Phantom','Arsonist','PlagueDoctor','Prophet','Twin','Gravedigger','Cursed','Amnesiac','Demon']
};

const BOT_NAMES = ['arunima', 'aakarsh', 'anshul', 'bharat', 'agam', 'ronak', 'prakhar'];

/* ==========================================================================
   NETWORK & STATE
   ========================================================================== */
const app = document.getElementById('app');

let net = { isHost: false, myId: null, myName: '', roomCode: '' };

let hostState = {
    roomCode: '', phase: 'MENU', players: [], dayCount: 0, dealtRoles: [],
    daysWithoutDeaths: 0, lastAliveCount: 0,
    roleMode: 'classic', // 'classic' or 'pool'
    activeRoles: [...PRESETS['Simple']], // classic mode
    rolePool: [], // pool mode
    settings: { discussTime: 90, voteTime: 30, mafiaCount: -1, botsCanBeMafia: true, hostPriority: true, poolBuilderCaps: true, doctorRepeatEnforced: true }, 
    timerEndsAt: null, autoAdvanced: false,
    nightQueue: [], currentNightRole: null, nightActions: {}, tempState: {},
    IdentityThiefActive: false, phantomReturns: [], skipVotes: {}, leaderboard: {}
};

let clientState = { phase: 'MENU', error: null, me: {}, players: [], tempState: {}, activeRoles: [], rolePool: [], roleMode: 'classic', settings: {} };

// Transient UI state (not synced)
let uiState = { phantomMode: 'kill', arsonistMode: 'douse', gravediggerKill: null, gravediggerExhume: null, stalkerTarget: null, stalkerGuess: '', amnesiacTarget: null, journalistTarget: null, journalistGuess: '', herbalistTarget: null };

/* ==========================================================================
   UTILITY FUNCTIONS
   ========================================================================== */
function generateId() { return Math.random().toString(36).substring(2, 9); }
function generateRoomCode() { return Array.from({length: 4}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]).join(''); }

function shuffle(array) {
    let a = [...array];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

function findPlayer(id) { return hostState.players.find(p => p.id === id); }
function findAliveRole(role) { return hostState.players.find(p => (p.role === role || (p.role === 'IdentityThief' && p.stolenRole === role)) && p.isAlive); }
function findAllAliveRole(role) { return hostState.players.filter(p => (p.role === role || (p.role === 'IdentityThief' && p.stolenRole === role)) && p.isAlive); }
function getName(id) { let p = findPlayer(id); return p ? p.name : '???'; }

function pickRandomTownPlayer(excludeId) {
    let candidates = hostState.players.filter(p => TOWN_ROLES.includes(p.role) && p.isAlive && p.id !== excludeId);
    if (candidates.length === 0) candidates = hostState.players.filter(p => p.isAlive && p.id !== excludeId);
    return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)].id : null;
}

function countInPool(roleKey) { return hostState.rolePool.filter(r => r === roleKey).length; }

function getVisiblyAlive(players) { return players.filter(p => p.isAlive && !p.fakeDeceased); }

/* ==========================================================================
   NETWORKING LOGIC
   ========================================================================== */
window.initHost = function(name) {
    clientState.phase = 'CONNECTING'; clientState.error = null; render();
    net.isHost = true; net.myId = generateId(); net.myName = name; net.roomCode = generateRoomCode();
    
    hostState.roomCode = net.roomCode;
    hostState.phase = 'LOBBY';
    hostState.players = [{ id: net.myId, name: name, ready: false, isAlive: true, isBot: false }];
    
    set(ref(db, 'rooms/' + net.roomCode), null).then(() => {
        const inboxRef = ref(db, 'rooms/' + net.roomCode + '/inbox');
        onChildAdded(inboxRef, (snapshot) => { 
            try { handleClientMessage(snapshot.val()); } 
            catch (e) { console.error("Message error:", e); } 
            remove(snapshot.ref); 
        });
        syncClients();
    }).catch((error) => {
        clientState.error = "Failed to connect: " + error.message; clientState.phase = 'MENU'; render();
    });
}

let unsubPublic = null;
let unsubPrivate = null;

window.initClient = function(name, code) {
    if (unsubPublic) { unsubPublic(); unsubPublic = null; }
    if (unsubPrivate) { unsubPrivate(); unsubPrivate = null; }
    
    clientState.phase = 'CONNECTING'; clientState.error = null; render();
    net.myId = generateId(); net.myName = name; net.roomCode = code.toUpperCase();
    sendAction('JOIN', { name: name });

    unsubPublic = onValue(ref(db, 'rooms/' + net.roomCode + '/publicState'), (snapshot) => {
        if (snapshot.exists()) { 
            let pub = snapshot.val();
            if (pub.players && !pub.players.some(p => p.id === net.myId)) {
                if (unsubPublic) { unsubPublic(); unsubPublic = null; }
                if (unsubPrivate) { unsubPrivate(); unsubPrivate = null; }
                clientState.error = "You were kicked by the host.";
                clientState.phase = 'MENU'; net.roomCode = ''; render(); return;
            }
            let myPub = pub.players ? pub.players.find(x => x.id === net.myId) : {};
            let currentMe = clientState.me || {};
            clientState = { ...clientState, ...pub, me: { ...currentMe, ...myPub } }; 
            render(); 
        } 
        else { 
            if (unsubPublic) { unsubPublic(); unsubPublic = null; }
            if (unsubPrivate) { unsubPrivate(); unsubPrivate = null; }
            clientState.error = "Room closed or not found."; clientState.phase = 'MENU'; render(); 
        }
    }, (error) => { 
        if (unsubPublic) { unsubPublic(); unsubPublic = null; }
        if (unsubPrivate) { unsubPrivate(); unsubPrivate = null; }
        clientState.error = "Connection dropped: " + error.message; clientState.phase = 'MENU'; render(); 
    });

    unsubPrivate = onValue(ref(db, 'rooms/' + net.roomCode + '/privateState/' + net.myId), (snapshot) => {
        if (snapshot.exists()) {
            let priv = snapshot.val(); 
            let currentMe = clientState.me || {};
            clientState.me = { ...currentMe, ...priv };
            clientState.mafiaMates = priv.mafiaMates || [];
            clientState.mafiaTarget = priv.mafiaTarget || null;
            clientState.nightTarget = priv.nightTarget || null;
            render();
        }
    });
}

window.sendAction = function(action, payload = {}) {
    if (net.isHost) handleClientMessage({ playerId: net.myId, type: action, ...payload });
    else push(ref(db, 'rooms/' + net.roomCode + '/inbox'), { playerId: net.myId, type: action, ...payload });
}

function handleClientMessage(data) {
    if (!net.isHost) return;

    if (data.type === 'JOIN') {
        if (hostState.phase !== 'LOBBY') return; 
        if (!hostState.players.find(p => p.id === data.playerId)) {
            hostState.players.push({ id: data.playerId, name: data.name, ready: false, isAlive: true, isBot: false });
            syncClients();
        }
    }
    else if (data.type === 'READY') {
        let p = hostState.players.find(x => x.id === data.playerId);
        if (p) p.ready = true;
        if (hostState.players.every(x => x.ready)) { if (hostState.phase === 'ROLE_DEAL') setupNight(); }
        syncClients();
    }
    else if (data.type === 'NIGHT_ACTION') {
        let p = hostState.players.find(x => x.id === data.playerId);
        if (!p || !p.isAlive) return;
        let roleGroupName = getRoleGroupName(p);

        if (hostState.currentNightRole === roleGroupName && !p.ready) {
            let actionVal = data.target;
            // Parse complex actions for special roles
            if (['Phantom','Arsonist','Gravedigger','Witch','Demon'].includes(p.role)) {
                try { actionVal = JSON.parse(data.target); } catch(e) {}
            }
            let targetKey = (p.role === 'IdentityThief' && p.stolenRole) ? p.stolenRole.toLowerCase() : p.role.toLowerCase();
            hostState.nightActions[targetKey] = actionVal;
            p.ready = true;
            syncClients(); 
            
            let activeRolePlayers = getActiveRolePlayers(roleGroupName);
            if (activeRolePlayers.every(x => x.ready)) { setTimeout(nextNightRole, 1500); }
        }
    }
    else if (data.type === 'VOTE') {
        let p = hostState.players.find(x => x.id === data.playerId);
        let target = hostState.players.find(x => x.id === data.target);
        if (p && p.isAlive && !p.blackmailed && !p.sabotaged && target && target.enragedImmunityDay !== hostState.dayCount) { 
            p.voteTarget = data.target; syncClients(); 
        }
    }
    else if (data.type === 'KICK') {
        hostState.players = hostState.players.filter(p => p.id !== data.targetId);
        syncClients();
    }
    else if (data.type === 'MAYOR_REVEAL') {
        let p = hostState.players.find(x => x.id === data.playerId);
        if (p && p.role === 'Mayor' && !p.mayorRevealed && p.isAlive) {
            p.mayorRevealed = true; syncClients();
        }
    }
    else if (data.type === 'DEMON_SILENCE') {
        let p = hostState.players.find(x => x.id === data.playerId);
        if (p && p.role === 'Demon' && p.isAlive && !p.demonVoteUsed) {
            p.demonVoteUsed = true;
            let target = findPlayer(data.target);
            if (target && target.isAlive) {
                target.demonSilenced = true;
            }
            syncClients();
        }
    }
    else if (data.type === 'SKIP_VOTE') {
        let p = hostState.players.find(x => x.id === data.playerId);
        if (p && p.isAlive && hostState.phase === 'DAY') {
            hostState.skipVotes[p.id] = true;
            let aliveCount = hostState.players.filter(x => x.isAlive).length;
            let skipCount = Object.keys(hostState.skipVotes).length;
            if (skipCount >= Math.floor(aliveCount / 2) + 1) {
                // Majority wants to skip — go to night
                hostState.skipVotes = {};
                setupNight();
                return;
            }
            syncClients();
        }
    }
    else if (data.type === 'STALKER_EXPOSE') {
        let p = hostState.players.find(x => x.id === data.playerId);
        if (p && p.role === 'Stalker' && p.isAlive && !p.stalkerUsed && hostState.phase === 'DAY') {
            let target = hostState.players.find(x => x.id === data.targetId);
            if (target && target.isAlive) {
                p.stalkerUsed = true;
                target.publiclyRevealedRole = true;
                if (!hostState.tempState.dayEvents) hostState.tempState.dayEvents = [];
                hostState.tempState.dayEvents.push(`👁️ The Stalker, ${p.name}, has publicly exposed ${target.name}'s role! They are the ${ROLES[target.role]?.name || target.role}!`);
                syncClients();
            }
        }
    }
    else if (data.type === 'AMNESIAC_REMEMBER') {
        let p = hostState.players.find(x => x.id === data.playerId);
        if (p && p.role === 'Amnesiac' && p.isAlive && !p.amnesiacUsed && hostState.phase === 'DAY') {
            let target = hostState.players.find(x => x.id === data.targetId);
            if (target && !target.isAlive) {
                p.amnesiacUsed = true;
                p.role = target.role;
                initializeRoleState(p);
                syncClients();
            }
        }
    }
    else if (data.type === 'JOURNALIST_ACCUSE') {
        let p = hostState.players.find(x => x.id === data.playerId);
        if (p && p.role === 'Journalist' && p.isAlive && !p.journalistUsed && hostState.phase === 'DAY') {
            let target = hostState.players.find(x => x.id === data.targetId);
            if (target && target.isAlive) {
                p.journalistUsed = true;
                if (!hostState.tempState.dayEvents) hostState.tempState.dayEvents = [];
                if (target.role === data.guessedRole) {
                    target.publiclyRevealedRole = true;
                    p.journalistImmunityDay = hostState.dayCount;
                    hostState.tempState.dayEvents.push(`📰 ${p.name} published a correct exposé! ${target.name} is confirmed to be the ${ROLES[data.guessedRole].name}! The Journalist gains one-night immunity.`);
                } else {
                    p.isAlive = false;
                    hostState.tempState.dayEvents.push(`📰 ${p.name} incorrectly accused ${target.name} of being the ${ROLES[data.guessedRole].name}! The Journalist, ${p.name}, has resigned in disgrace and is eliminated.`);
                }
                
                let win = checkWin();
                if (win) { triggerGameOver(win); return; }
                else { syncClients(); }
            }
        }
    }
    else if (data.type === 'HERBALIST_USE') {
        let p = hostState.players.find(x => x.id === data.playerId);
        if (p && p.role === 'Herbalist' && p.isAlive && !p.herbalistUsed && hostState.phase === 'DAY') {
            let target = hostState.players.find(x => x.id === data.targetId);
            if (target && target.isAlive) {
                p.herbalistUsed = true;
                if (p.herbalistPotion === 'Heal') target.herbalistProtected = true;
                else if (p.herbalistPotion === 'Reveal') p.herbalistRevealResult = `You revealed ${target.name} as a ${ROLES[target.role].name} (${ROLES[target.role].team})`;
                else if (p.herbalistPotion === 'Poison') {
                    target.herbalistPoisoned = true;
                    if (!hostState.tempState.dayEvents) hostState.tempState.dayEvents = [];
                    hostState.tempState.dayEvents.push(`🧪 ${target.name} has been poisoned and will die at dusk unless voted out!`);
                }
                syncClients();
            }
        }
    }
}

function getRoleGroupName(p) {
    if (MAFIA_GROUP_ROLES.includes(p.role)) return 'Mafia';
    return p.role;
}

function getActiveRolePlayers(roleGroupName) {
    return hostState.players.filter(x => {
        let g = getRoleGroupName(x);
        return g === roleGroupName && x.isAlive;
    });
}

/* ==========================================================================
   SYNC CLIENTS
   ========================================================================== */
function syncClients() {
    if (!net.isHost) return;
    
    let isGameOver = (hostState.phase === 'GAME_OVER');

    const safePlayers = hostState.players.map(x => ({
        id: x.id, name: x.name, 
        isAlive: x.isAlive && !x.fakeDeceased,
        ready: x.ready || false, isBot: x.isBot || false,
        voteTarget: x.voteTarget || null, 
        roleReveal: (isGameOver || x.publiclyRevealedRole) ? x.role : null,
        mayorRevealed: x.mayorRevealed || false,
        publiclyRevealedRole: x.publiclyRevealedRole || false,
        enragedImmunityDay: x.enragedImmunityDay || null
    }));

    const safeTempState = JSON.parse(JSON.stringify(hostState.tempState || {})); 
    
    const privateIntelKeys = ['detResult', 'drunkDetResult', 'consigliereResult', 'blackmailerResult', 'spyResult', 'watcherResult', 'IdentityThiefResult', 'stalkerResult', 'gravediggerResult', 'escortDiedToSK', 'escortDiedToParanoid', 'doctorDiedToSK', 'detectiveDiedToSK'];
    let intelMap = {};
    privateIntelKeys.forEach(k => {
        if (safeTempState[k]) {
            intelMap[k] = safeTempState[k];
            delete safeTempState[k];
        }
    });

    let poolSummary = { town: 0, mafia: 0, neutral: 0 };
    hostState.rolePool.forEach(r => {
        if (ROLES[r]) {
            if (ROLES[r].team === 'Town') poolSummary.town++;
            else if (ROLES[r].team === 'Mafia') poolSummary.mafia++;
            else poolSummary.neutral++;
        }
    });

    const publicState = {
        phase: hostState.phase, dayCount: hostState.dayCount, roomCode: hostState.roomCode,
        currentNightRole: hostState.currentNightRole || null, tempState: safeTempState, 
        players: safePlayers, 
        activeRoles: hostState.activeRoles,
        rolePool: hostState.rolePool,
        roleMode: hostState.roleMode,
        poolSummary: poolSummary,
        leaderboard: hostState.leaderboard,
        settings: hostState.settings, timerEndsAt: hostState.timerEndsAt || null,
        mayorReveals: hostState.players.filter(p => p.mayorRevealed).map(p => p.name),
        skipVotes: hostState.skipVotes || {}
    };

    let updates = {};
    updates['rooms/' + hostState.roomCode + '/publicState'] = publicState;

    hostState.players.filter(p => !p.isBot).forEach(p => {
        let privateData = { id: p.id, name: p.name, role: p.role || null, isAlive: p.isAlive, ready: p.ready || false };
        
        if (ALL_MAFIA_MEMBERS.includes(p.role)) {
            privateData.mafiaMates = hostState.players.filter(m => ALL_MAFIA_MEMBERS.includes(m.role) && m.id !== p.id).map(m => m.name);
            privateData.mafiaTarget = hostState.nightActions.mafia || hostState.nightActions.godfather || hostState.nightActions.identitythief || null;
        } else if (p.role) {
            let targetKey = (p.role === 'IdentityThief' && p.stolenRole) ? p.stolenRole.toLowerCase() : p.role.toLowerCase();
            privateData.nightTarget = hostState.nightActions[targetKey] || null;
        }
        
        if (p.role === 'Doctor') privateData.lastProtected = p.lastProtected || null;
        if (p.role === 'Executioner' && p.executionerTarget) privateData.executionerTargetName = getName(p.executionerTarget);
        if (p.role === 'GuardianAngel' && p.guardianTarget) privateData.guardianTargetName = getName(p.guardianTarget);
        if (p.role === 'Survivor') privateData.survivorVests = p.survivorVests ?? 3;
        if (p.role === 'Trapper') privateData.trapperCharges = p.trapperCharges ?? 2;
        if (p.role === 'Mayor') privateData.mayorRevealed = p.mayorRevealed || false;
        if (p.blackmailed) privateData.blackmailed = true;
        if (p.role === 'Witch' && p.witchPuppetRole) privateData.witchPuppetRoleName = ROLES[p.witchPuppetRole]?.name || p.witchPuppetRole;
        if (p.role === 'Prophet') privateData.prophetAscended = p.prophetAscended || false;
        if (p.sabotaged) privateData.sabotaged = true;
        if (p.demonSilenced) privateData.demonSilenced = true;
        if (p.demonShuffled) privateData.demonShuffled = true;
        if (p.cursedActivated) privateData.cursedActivated = true;
        if (p.role === 'Demon') { privateData.demonResurrectUsed = p.demonResurrectUsed || false; privateData.demonShuffleUsed = p.demonShuffleUsed || false; privateData.demonVoteUsed = p.demonVoteUsed || false; }
        if (p.role === 'Stalker') { privateData.stalkerUsed = p.stalkerUsed || false; }
        if (p.role === 'Herbalist') { privateData.herbalistUsed = p.herbalistUsed || false; privateData.herbalistPotion = p.herbalistPotion; privateData.herbalistRevealResult = p.herbalistRevealResult; }
        if (p.role === 'Amnesiac') { privateData.amnesiacUsed = p.amnesiacUsed || false; }
        if (p.role === 'Journalist') { privateData.journalistUsed = p.journalistUsed || false; }
        if (p.role === 'Phantom') privateData.phantomDecoyUsed = p.phantomDecoyUsed || false;
        if (p.role === 'Arsonist') privateData.dousedCount = (p.dousedPlayers || []).length;
        if (p.role === 'EvilTwin') {
            let twin = hostState.players.find(x => x.role === 'InnocentTwin');
            if (twin) privateData.twinName = twin.name;
        }
        if (p.role === 'InnocentTwin') {
            let twin = hostState.players.find(x => x.role === 'EvilTwin');
            if (twin) privateData.twinName = twin.name;
        }
        if (p.role === 'Escort') {
            if (intelMap.escortDiedToSK) privateData.escortDiedToSK = intelMap.escortDiedToSK;
            if (intelMap.escortDiedToParanoid) privateData.escortDiedToParanoid = intelMap.escortDiedToParanoid;
        }
        if (p.role === 'Doctor') {
            if (intelMap.doctorDiedToSK) privateData.doctorDiedToSK = intelMap.doctorDiedToSK;
        }
        if (p.role === 'Detective') {
            if (intelMap.detResult) privateData.detResult = intelMap.detResult;
            if (intelMap.detectiveDiedToSK) privateData.detectiveDiedToSK = intelMap.detectiveDiedToSK;
        }
        if (p.role === 'DrunkDetective' && intelMap.drunkDetResult) privateData.drunkDetResult = intelMap.drunkDetResult;
        if (p.role === 'Consigliere' && intelMap.consigliereResult) privateData.consigliereResult = intelMap.consigliereResult;
        if (p.role === 'Blackmailer' && intelMap.blackmailerResult) privateData.blackmailerResult = intelMap.blackmailerResult;
        if (p.role === 'Spy' && intelMap.spyResult) privateData.spyResult = intelMap.spyResult;
        if (p.role === 'Watcher' && intelMap.watcherResult) privateData.watcherResult = intelMap.watcherResult;
        if (p.role === 'IdentityThief' && intelMap.IdentityThiefResult) privateData.IdentityThiefResult = intelMap.IdentityThiefResult;
        if (p.role === 'Stalker' && intelMap.stalkerResult) privateData.stalkerResult = intelMap.stalkerResult;
        if (p.role === 'Gravedigger' && intelMap.gravediggerResult) privateData.gravediggerResult = intelMap.gravediggerResult;
        if (p.isAlive && p.infectedNight && (hostState.dayCount - p.infectedNight === 1)) {
            privateData.plagueWarning = true;
        }

        updates['rooms/' + hostState.roomCode + '/privateState/' + p.id] = privateData;
    });

    update(ref(db), updates);

    let myPub = hostState.players.find(p => p.id === net.myId) || {};
    let myPriv = updates['rooms/' + hostState.roomCode + '/privateState/' + net.myId] || {};
    clientState = { ...clientState, ...publicState, me: { ...myPub, ...myPriv } };
    
    if (clientState.me && ALL_MAFIA_MEMBERS.includes(clientState.me.role)) {
        clientState.mafiaMates = hostState.players.filter(m => ALL_MAFIA_MEMBERS.includes(m.role) && m.id !== net.myId).map(m => m.name);
        clientState.mafiaTarget = hostState.nightActions.mafia || hostState.nightActions.godfather || hostState.nightActions.identitythief || null;
    } else {
        clientState.mafiaMates = [];
        clientState.mafiaTarget = null;
    }
    
    render();
}

/* ==========================================================================
   GLOBAL TIMER ENGINE
   ========================================================================== */
setInterval(() => {
    if (!clientState) return;
    
    let el = document.getElementById('nav-timer-container');
    if (el) {
        if (clientState.timerEndsAt && (clientState.phase === 'DAY' || clientState.phase === 'VOTE')) {
            let left = Math.max(0, Math.floor((clientState.timerEndsAt - Date.now()) / 1000));
            el.style.display = 'block';
            let m = Math.floor(left / 60).toString().padStart(2, '0');
            let s = (left % 60).toString().padStart(2, '0');
            el.innerText = `${m}:${s}`;
            el.style.color = (left <= 10 && left > 0) ? 'var(--blood-lit)' : 'var(--gold)';
        } else {
            el.style.display = 'none';
        }
    }

    let left = clientState.timerEndsAt ? Math.max(0, Math.floor((clientState.timerEndsAt - Date.now()) / 1000)) : 0;

    if (net.isHost && left === 0 && !hostState.autoAdvanced) {
        hostState.autoAdvanced = true;
        if (hostState.phase === 'DAY') {
            hostState.phase = 'VOTE'; 
            hostState.players.forEach(p=>p.voteTarget=null); 
            hostState.timerEndsAt = Date.now() + (hostState.settings.voteTime * 1000);
            hostState.autoAdvanced = false;
            syncClients();
        }
        else if (hostState.phase === 'VOTE') {
            window.finalizeVote();
        }
    }
}, 1000);

/* ==========================================================================
   BOT AI ENGINE
   ========================================================================== */
function scheduleBotActions() {
    if (!net.isHost) return;

    setTimeout(() => {
        let changed = false;

        if (hostState.phase === 'ROLE_DEAL') {
            hostState.players.forEach(p => { if (p.isBot && !p.ready) { p.ready = true; changed = true; } });
            if (changed) {
                syncClients();
                if (hostState.players.every(x => x.ready)) setTimeout(setupNight, 1000);
            }
        }
        else if (hostState.phase === 'DAY') {
            hostState.players.forEach(b => {
                if (b.isBot && b.isAlive) {
                    if (b.role === 'Amnesiac' && !b.amnesiacUsed) {
                        let dead = hostState.players.filter(p => !p.isAlive && p.id !== b.id && !ALL_MAFIA_MEMBERS.includes(p.role));
                        if (dead.length > 0) handleClientMessage({ type: 'AMNESIAC_REMEMBER', playerId: b.id, targetId: dead[Math.floor(Math.random() * dead.length)].id });
                    }
                    else if (b.role === 'Journalist' && !b.journalistUsed && Math.random() < 0.2) {
                        let others = hostState.players.filter(p => p.isAlive && p.id !== b.id);
                        if (others.length > 0) {
                            let roles = Object.keys(ROLES).filter(r => !ROLES[r]._internal);
                            handleClientMessage({ type: 'JOURNALIST_ACCUSE', playerId: b.id, targetId: others[Math.floor(Math.random() * others.length)].id, guessedRole: roles[Math.floor(Math.random() * roles.length)] });
                        }
                    }
                    else if (b.role === 'Herbalist' && !b.herbalistUsed && b.herbalistPotion) {
                        let others = hostState.players.filter(p => p.isAlive && p.id !== b.id);
                        if (others.length > 0) handleClientMessage({ type: 'HERBALIST_USE', playerId: b.id, targetId: others[Math.floor(Math.random() * others.length)].id });
                    }
                    else if (b.role === 'Stalker' && !b.stalkerUsed && Math.random() < 0.2) {
                        let others = hostState.players.filter(p => p.isAlive && p.id !== b.id);
                        if (others.length > 0) {
                            handleClientMessage({ type: 'STALKER_EXPOSE', playerId: b.id, targetId: others[Math.floor(Math.random() * others.length)].id });
                        }
                    }
                }
            });
        }
        else if (hostState.phase === 'NIGHT') {
            let roleGroupName = hostState.currentNightRole;
            let activeBots = hostState.players.filter(p => 
                p.isBot && p.isAlive && !p.ready && getRoleGroupName(p) === roleGroupName
            );
            
            if (activeBots.length > 0) {
                activeBots.forEach(b => {
                    let alive = getVisiblyAlive(hostState.players);
                    let nonSelf = alive.filter(p => p.id !== b.id);
                    let nonMafia = alive.filter(p => !ALL_MAFIA_MEMBERS.includes(p.role));
                    let target = null;

                    let activeRole = (b.role === 'IdentityThief' && b.stolenRole) ? b.stolenRole : b.role;
                    switch(activeRole) {
                        case 'Villager': case 'Mayor': case 'Jester': case 'Executioner': case 'InnocentTwin':
                            break;
                        case 'Doctor': case 'Bodyguard': case 'ParanoidDoctor':
                        case 'Detective': case 'DrunkDetective': case 'Spy': case 'Watcher':
                        case 'Escort': case 'Witch': case 'Saboteur':
                            target = nonSelf.length > 0 ? nonSelf[Math.floor(Math.random() * nonSelf.length)].id : null;
                            break;
                        case 'Trapper':
                            if (b.trapperCharges > 0) {
                                target = nonSelf.length > 0 ? nonSelf[Math.floor(Math.random() * nonSelf.length)].id : null;
                            }
                            break;
                        case 'Vigilante':
                            let nonTown = nonSelf.filter(p => !TOWN_ROLES.includes(p.role));
                            let pool = nonTown.length > 0 ? nonTown : nonSelf;
                            target = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].id : null;
                            break;
                        case 'Mafia': case 'Godfather': case 'IdentityThief':
                            target = nonMafia.length > 0 ? nonMafia[Math.floor(Math.random() * nonMafia.length)].id : null;
                            break;
                        case 'Framer': case 'Consigliere': case 'Blackmailer':
                            target = nonMafia.length > 0 ? nonMafia[Math.floor(Math.random() * nonMafia.length)].id : null;
                            break;
                        case 'SerialKiller':
                            let nonSK = alive.filter(p => p.role !== 'SerialKiller');
                            target = nonSK.length > 0 ? nonSK[Math.floor(Math.random() * nonSK.length)].id : null;
                            break;
                        case 'Survivor':
                            target = b.id;
                            break;
                        case 'GuardianAngel':
                            target = b.guardianTarget || null;
                            break;
                        case 'Stalker':
                            target = nonSelf.length > 0 ? nonSelf[Math.floor(Math.random() * nonSelf.length)].id : null;
                            break;
                        case 'Phantom':
                            target = JSON.stringify({ action: 'kill', target: nonSelf.length > 0 ? nonSelf[Math.floor(Math.random() * nonSelf.length)].id : null });
                            break;
                        case 'Arsonist':
                            if ((b.dousedPlayers || []).length >= 2 && Math.random() > 0.5) {
                                target = JSON.stringify({ action: 'ignite' });
                            } else {
                                let t = nonSelf.length > 0 ? nonSelf[Math.floor(Math.random() * nonSelf.length)].id : null;
                                target = JSON.stringify({ action: 'douse', target: t });
                            }
                            break;
                        case 'PlagueDoctor':
                            target = nonSelf.length > 0 ? nonSelf[Math.floor(Math.random() * nonSelf.length)].id : null;
                            break;
                        case 'EvilTwin':
                            let nonTwin = alive.filter(p => p.role !== 'EvilTwin' && p.role !== 'InnocentTwin');
                            target = nonTwin.length > 0 ? nonTwin[Math.floor(Math.random() * nonTwin.length)].id : null;
                            break;
                        case 'Gravedigger':
                            let deadPlayers = hostState.players.filter(p => !p.isAlive);
                            let killT = nonSelf.length > 0 ? nonSelf[Math.floor(Math.random() * nonSelf.length)].id : null;
                            let exhumeT = deadPlayers.length > 0 ? deadPlayers[Math.floor(Math.random() * deadPlayers.length)].id : null;
                            target = JSON.stringify({ kill: killT, exhume: exhumeT });
                            break;
                        case 'Prophet':
                            target = nonSelf.length > 0 ? nonSelf[Math.floor(Math.random() * nonSelf.length)].id : null;
                            break;
                    }
                    
                    let actionVal = target;
                    if (target !== null && target !== undefined) {
                        if (['Phantom','Arsonist','Gravedigger','Witch','Demon'].includes(b.role)) {
                            try { actionVal = JSON.parse(target); } catch(e) {}
                        }
                    }
                    hostState.nightActions[b.role.toLowerCase()] = actionVal;
                    b.ready = true;
                    changed = true;
                });
            }
            
            if (changed) {
                syncClients();
                let activeRolePlayers = getActiveRolePlayers(roleGroupName);
                if (activeRolePlayers.every(x => x.ready)) setTimeout(nextNightRole, 1500);
            }
        }
        else if (hostState.phase === 'VOTE') {
            let votingBots = hostState.players.filter(p => p.isBot && p.isAlive && !p.voteTarget && !p.blackmailed && !p.sabotaged);
            if (votingBots.length > 0) {
                let alivePlayers = hostState.players.filter(p => p.isAlive && !p.fakeDeceased);
                votingBots.forEach(b => {
                    if (Math.random() > 0.2) {
                        let target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                        b.voteTarget = target.id;
                    }
                });
                changed = true;
            }
            if (changed) syncClients();
        }
    }, 2000 + (Math.random() * 2000));
}

/* ==========================================================================
   GAME ENGINE & WIN LOGIC
   ========================================================================== */
function initializeRoleState(p) {
    if (p.role === 'Executioner') p.executionerTarget = pickRandomTownPlayer(p.id);
    if (p.role === 'GuardianAngel') p.guardianTarget = pickRandomTownPlayer(p.id);
    if (p.role === 'Survivor') p.survivorVests = 3;
    if (p.role === 'Trapper') p.trapperCharges = 2;
    if (p.role === 'Mayor') p.mayorRevealed = false;
    if (p.role === 'ParanoidDoctor') p.paranoidOutcome = null;
    if (p.role === 'Phantom') p.phantomDecoyUsed = false;
    if (p.role === 'Arsonist') p.dousedPlayers = [];
    if (p.role === 'Stalker') { p.stalkerUsed = false; }
    if (p.role === 'Saboteur') p.saboteurActive = true;
    if (p.role === 'Herbalist') {
        p.herbalistPotion = ['Heal', 'Reveal', 'Poison'][Math.floor(Math.random() * 3)];
        p.herbalistUsed = false;
    }
    if (p.role === 'Amnesiac') p.amnesiacUsed = false;
    if (p.role === 'Journalist') p.journalistUsed = false;
}

function assignRoles() {
    let n = hostState.players.length;
    let pool = [];

    if (hostState.roleMode === 'pool') {
        pool = [...hostState.rolePool];
    } else {
        let active = hostState.activeRoles;
        let mafiaCount = hostState.settings.mafiaCount === -1 
            ? Math.max(1, Math.floor(n / 3)) 
            : Math.min(n - 1, hostState.settings.mafiaCount);

        if (active.includes('Godfather') && mafiaCount > 0) { pool.push('Godfather'); mafiaCount--; }
        if (active.includes('Framer') && mafiaCount > 0) { pool.push('Framer'); mafiaCount--; }
        if (active.includes('Consigliere') && mafiaCount > 0) { pool.push('Consigliere'); mafiaCount--; }
        if (active.includes('Blackmailer') && mafiaCount > 0) { pool.push('Blackmailer'); mafiaCount--; }
        if (active.includes('IdentityThief') && mafiaCount > 0) { pool.push('IdentityThief'); mafiaCount--; }
        while(mafiaCount > 0) { pool.push('Mafia'); mafiaCount--; }

        let neutralOrder = ['SerialKiller','Jester','Witch','Executioner','Survivor','GuardianAngel','Saboteur','Phantom','Arsonist','PlagueDoctor','Prophet','Twin','Gravedigger','Cursed','Amnesiac','Demon'];
        neutralOrder.forEach(r => { if (active.includes(r) && pool.length < n) pool.push(r); });

        let townSpecials = ['Doctor','Detective','Vigilante','Escort','Bodyguard','Mayor','Spy','Watcher','DrunkDetective','ParanoidDoctor','Trapper','Journalist','Herbalist'];
        townSpecials.forEach(r => { if (active.includes(r) && pool.length < n) pool.push(r); });

        while (pool.length < n) pool.push('Villager');
        if (pool.length > n) pool = pool.slice(0, n);
    }

    let twinCount = pool.filter(r => r === 'Twin').length;
    if (twinCount >= 2) {
        let idx1 = pool.indexOf('Twin'); pool[idx1] = 'EvilTwin';
        let idx2 = pool.indexOf('Twin'); pool[idx2] = 'InnocentTwin';
        while (pool.includes('Twin')) { pool[pool.indexOf('Twin')] = 'InnocentTwin'; }
    } else if (twinCount === 1) {
        pool[pool.indexOf('Twin')] = 'InnocentTwin';
    }

    pool = shuffle(pool);

    if (!hostState.settings.botsCanBeMafia) {
        let mafiaCards = pool.filter(r => ALL_MAFIA_MEMBERS.includes(r));
        let nonMafiaCards = pool.filter(r => !ALL_MAFIA_MEMBERS.includes(r));
        mafiaCards = shuffle(mafiaCards);
        nonMafiaCards = shuffle(nonMafiaCards);
        
        let humans = shuffle(hostState.players.filter(p => !p.isBot));
        let bots = shuffle(hostState.players.filter(p => p.isBot));
        
        humans.forEach(p => { p.role = mafiaCards.length > 0 ? mafiaCards.pop() : nonMafiaCards.pop(); });
        bots.forEach(p => { p.role = mafiaCards.length > 0 ? mafiaCards.pop() : nonMafiaCards.pop(); });
        
        hostState.players.forEach(p => { p.isAlive = true; p.ready = false; p.lastProtected = false; });
    } else {
        // Find the host (usually the only human when testing)
        let hostPlayer = hostState.players.find(p => p.id === net.myId) || hostState.players.find(p => !p.isBot);
        
        // Give host a non-Villager, non-Mafia role if possible, for better testing experience
        if (hostState.settings.hostPriority && hostPlayer && pool.some(r => r !== 'Villager' && r !== 'Mafia')) {
            let specialIdx = pool.findIndex(r => r !== 'Villager' && r !== 'Mafia');
            if (specialIdx !== -1) {
                let specialRole = pool.splice(specialIdx, 1)[0];
                hostPlayer.role = specialRole;
            }
        }
        
        // Distribute remaining roles
        let remainingPlayers = hostState.players.filter(p => !p.role);
        remainingPlayers.forEach((p, i) => { p.role = pool[i]; });
        hostState.players.forEach(p => { p.isAlive = true; p.ready = false; p.lastProtected = false; });
    }

    hostState.dealtRoles = [...new Set(hostState.players.map(p => p.role))];

    hostState.players.forEach(p => {
        initializeRoleState(p);
    });
}

function checkWin() {
    let alive = hostState.players.filter(p => p.isAlive && !p.fakeDeceased);
    if (alive.length === 0) return { id: 'DRAW', team: 'Neutral', title: 'Everyone Perished.', winningTeams: [], winningRoles: [] };

    let mafia  = alive.filter(p => ALL_MAFIA_MEMBERS.includes(p.role) && !p.fakeDeceased).length;
    let sk     = alive.filter(p => NEUTRAL_KILLERS.includes(p.role) && !p.fakeDeceased).length;
    let town   = alive.filter(p => TOWN_ROLES.includes(p.role) && !p.fakeDeceased).length;
    let neutral = alive.filter(p => NEUTRAL_PASSIVE.includes(p.role) && !p.fakeDeceased).length;

    let surWin = alive.filter(p => p.role === 'Survivor').map(p => p.name);
    if (surWin.length > 0) hostState.tempState.survivorWin = surWin;
    else delete hostState.tempState.survivorWin;

    let angWin = alive.filter(p => p.role === 'GuardianAngel' && findPlayer(p.guardianTarget)?.isAlive).map(p => p.name);
    if (angWin.length > 0) hostState.tempState.angelWin = angWin;
    else delete hostState.tempState.angelWin;

    let prophetWin = alive.filter(p => p.role === 'Prophet' && p.prophetAscended).map(p => p.name);
    if (prophetWin.length > 0) hostState.tempState.prophetWin = prophetWin;
    else delete hostState.tempState.prophetWin;

    if (mafia === 0 && sk === 0) return { id: 'TOWN_WIN', team: 'Town', title: 'The Town Prevails', winningTeams: ['Town'] };
    if (mafia >= (town + neutral + sk) && sk === 0) return { id: 'MAFIA_WIN', team: 'Mafia', title: 'The Mafia Claims the Night', winningTeams: ['Mafia'] };
    
    if (sk >= town + neutral + mafia && mafia === 0) {
        let killer = alive.find(p => NEUTRAL_KILLERS.includes(p.role));
        let title = killer ? `The ${ROLES[killer.role].name} Wins` : 'The Serial Killer Wins';
        return { id: 'SK_WIN', team: 'Neutral', title: title, winningTeams: [], winningRoles: [killer ? killer.role : 'SerialKiller'] };
    }

    if (hostState.daysWithoutDeaths >= 3) {
        return { id: 'DRAW', team: 'Neutral', title: 'A Stalemate Was Reached.', winningTeams: [], winningRoles: [] };
    }

    if (hostState.dayCount >= 5) {
        let saboteur = alive.find(p => p.role === 'Saboteur');
        let mafiaAlive = alive.some(p => ALL_MAFIA_MEMBERS.includes(p.role));
        if (saboteur && mafiaAlive) {
            hostState.tempState.saboteurWin = [saboteur.name];
            return { id: 'SABOTEUR_WIN', team: 'Neutral', title: `${saboteur.name} the Saboteur Wins!`, winningTeams: [], winningRoles: ['Saboteur'] };
        }
    }

    return null; 
}

function convertCursedIfNeeded(deadRole) {
    if (ALL_MAFIA_MEMBERS.includes(deadRole)) {
        let c = hostState.players.find(c => c.role === 'Cursed' && c.isAlive);
        if (c) {
            c.role = 'Mafia';
            c.cursedActivated = true;
            initializeRoleState(c);
        }
    }
}

function triggerGameOver(win) {
    hostState.tempState.winner = win;
    hostState.phase = 'GAME_OVER';
    
    let winningTeams = win.winningTeams || [];
    let winningRoles = win.winningRoles || [];

    hostState.players.forEach(p => {
        if (p.isBot) return;
        if (!hostState.leaderboard[p.name]) {
            hostState.leaderboard[p.name] = { games: 0, wins: 0 };
        }
        hostState.leaderboard[p.name].games++;
        
        let won = false;
        
        if (win.id === 'JESTER_WIN' && p.role === 'Jester' && p.id === win.jesterId) won = true;
        else if (win.id === 'EXECUTIONER_WIN' && p.role === 'Executioner' && p.id === win.execId) won = true;
        else if (p.isAlive) {
            if (winningTeams.includes(ROLES[p.role]?.team)) won = true;
            if (winningRoles.includes(p.role)) won = true;
            
            // Faction independent conditions:
            if (p.role === 'Survivor' && hostState.tempState.survivorWin?.includes(p.name)) won = true;
            if (p.role === 'Executioner' && hostState.tempState.executionerWin?.includes(p.name)) won = true;
            if (p.role === 'Saboteur' && hostState.tempState.saboteurWin?.includes(p.name)) won = true;
            if (p.role === 'Cursed' && win.id === 'TOWN_WIN') won = true;
            if (p.role === 'Witch' && win.id !== 'TOWN_WIN' && win.id !== 'DRAW' && win.id !== 'JESTER_WIN') won = true;
            if (p.role === 'GuardianAngel' && hostState.tempState.angelWin?.includes(p.name)) won = true;
            if (p.role === 'Prophet' && hostState.tempState.prophetWin?.includes(p.name)) won = true;
            if (p.role === 'Demon' && p.demonResurrectUsed && p.demonShuffleUsed && p.demonVoteUsed) won = true;
        } else {
            // Dead players who still win
            if (p.role === 'Executioner' && hostState.tempState.executionerWin?.includes(p.name)) won = true;
            if (p.role === 'Jester' && hostState.tempState.jesterWin?.includes(p.name)) won = true;
            if (p.role === 'GuardianAngel' && hostState.tempState.angelWin?.includes(p.name)) won = true;
        }
        
        if (won) {
            hostState.leaderboard[p.name].wins++;
        }
    });
    
    syncClients();
}

window.startGame = function() {
    let n = hostState.players.length;
    if (n < 3) return;
    
    if (hostState.roleMode === 'pool') {
        while (hostState.rolePool.length < n) hostState.rolePool.push('Villager');
        while (hostState.rolePool.length > n) hostState.rolePool.pop();
        if (!hostState.rolePool.includes('Villager')) {
            hostState.rolePool[0] = 'Villager';
        }
    }
    
    hostState.timerEndsAt = null;
    assignRoles();
    hostState.phase = 'ROLE_DEAL';
    hostState.dayCount = 0;
    hostState.daysWithoutDeaths = 0;
    hostState.lastAliveCount = hostState.players.length;
    hostState.players.forEach(p => p.ready = false);
    syncClients();
    scheduleBotActions(); 
}

/* ==========================================================================
   NIGHT LOGIC
   ========================================================================== */
function setupNight() {
    hostState.timerEndsAt = null;
    hostState.dayCount++;

    if (hostState.deathsSinceLastDawn === 0 && hostState.dayCount > 1) {
        hostState.daysWithoutDeaths = (hostState.daysWithoutDeaths || 0) + 1;
    } else {
        hostState.daysWithoutDeaths = 0;
    }
    hostState.deathsSinceLastDawn = 0;

    hostState.nightActions = {};
    hostState.tempState = {};
    hostState.skipVotes = {};
    hostState.players.forEach(p => {
        p.voteTarget = null;
        p.blackmailed = false;
        p.sabotaged = false;
        p.demonSilenced = false;
    });

    hostState.players.forEach(p => {
        if (p.fakeDeceased) {
            p.fakeDeceased = false;
            hostState.phantomReturns = hostState.phantomReturns || [];
            hostState.phantomReturns.push(p.name);
        }
    });


    
    hostState.nightQueue = [];
    NIGHT_ORDER.forEach(r => {
        if (r === 'Mafia') {
            if (hostState.dealtRoles.some(dr => MAFIA_GROUP_ROLES.includes(dr))) {
                hostState.nightQueue.push('Mafia');
            }
        } else {
            if (hostState.dealtRoles.includes(r)) {
                hostState.nightQueue.push(r);
            }
        }
    });
    
    nextNightRole();
}

function nextNightRole() {
    if (!net.isHost) return;
    if (hostState._advancing) return;
    hostState._advancing = true;

    if (hostState.nightQueue.length === 0) {
        resolveNight();
        hostState._advancing = false;
    }
    else {
        hostState.currentNightRole = hostState.nightQueue.shift();
        hostState.phase = 'NIGHT';
        hostState.players.forEach(p => p.ready = false);
        syncClients();
        
        let activeRolePlayers = getActiveRolePlayers(hostState.currentNightRole);
        
        if (activeRolePlayers.length === 0) {
            hostState._advancing = false;
            setTimeout(() => { nextNightRole(); }, Math.floor(Math.random() * 1000) + 1500);
        } else {
            let noActionRoles = ['Villager','Mayor','Jester','InnocentTwin','Amnesiac','Journalist','Herbalist','Executioner','Cursed'];
            if (activeRolePlayers.every(p => noActionRoles.includes(p.role))) {
                hostState._advancing = false;
                setTimeout(() => { nextNightRole(); }, 500);
            } else {
                scheduleBotActions();
                hostState._advancing = false;
            }
        }
    }
}

function resolveNight() {
    hostState.timerEndsAt = null;
    let acts = hostState.nightActions;
    let kills = [];
    let deaths = [];
    let saved = false;
    let visits = {};
    
    let trapperPlayer = findAliveRole('Trapper');

    hostState.players.forEach(p => {
        if (p.vigilanteGuilt && p.isAlive && !p.fakeDeceased) {
            p.isAlive = false;
            p.vigilanteGuilt = false;
            deaths.push({ name: p.name, id: p.id, cause: 'The Vigilante died of guilt.' });
        }
    });

    let escortBlock = acts.escort || null;
    let witchAction = acts.witch || null; // Will be { puppetId, victimId }
    
    let escortPlayer = findAliveRole('Escort');
    if (!escortPlayer) escortBlock = null;
    let witchPlayer = findAliveRole('Witch');
    if (!witchPlayer) witchAction = null;
    if (escortPlayer && escortBlock === escortPlayer.id) escortBlock = null;

    // Escort can block Witch
    let witchBlocked = witchPlayer && escortBlock === witchPlayer.id;
    if (witchBlocked) witchAction = null;
    
    // Witch overrides actions
    if (witchAction && witchAction.puppetId && witchAction.victimId) {
        let puppet = findPlayer(witchAction.puppetId);
        let victim = findPlayer(witchAction.victimId);
        if (puppet && victim) {
            witchPlayer.witchPuppetRole = puppet.role;
            let roleLower = puppet.role.toLowerCase();
            
            if (puppet.role === 'Phantom') {
                acts.phantom = { action: 'kill', target: victim.id };
            } else if (puppet.role === 'Gravedigger') {
                acts.gravedigger = { kill: victim.id, bury: null };
            } else if (puppet.role === 'Demon') {
                acts.demon = { action: 'resurrect', target: victim.id };
            } else {
                if (ALL_MAFIA_MEMBERS.includes(puppet.role)) {
                    if (puppet.role === 'Godfather') acts.godfather = victim.id;
                    else if (puppet.role === 'Mafia') acts.mafia = victim.id;
                }
                acts[roleLower] = victim.id;
            }
        }
    }

    const isBlocked = (pid) => pid === escortBlock;

    const logVisit = (roleId, targetId) => {
        if (!targetId || typeof targetId !== 'string') return; 
        if (!visits[targetId]) visits[targetId] = [];
        let p = findPlayer(roleId);
        if (p) visits[targetId].push({ id: p.id, name: p.name, role: p.role });
    };

    const logIfValid = (roleName, targetId) => {
        let p = findAliveRole(roleName);
        if (p && !isBlocked(p.id) && targetId && typeof targetId === 'string') {
            logVisit(p.id, targetId);
        }
    };

    if (acts.saboteur) logIfValid('Saboteur', acts.saboteur);
    if (acts.framer) logIfValid('Framer', acts.framer);
    if (acts.trapper && trapperPlayer && trapperPlayer.trapperCharges > 0) logIfValid('Trapper', acts.trapper);
    if (acts.consigliere) logIfValid('Consigliere', acts.consigliere);
    if (acts.blackmailer) logIfValid('Blackmailer', acts.blackmailer);
    
    let mafiaTargetForVisit = acts.godfather || acts.mafia || acts.identitythief;
    if (mafiaTargetForVisit) {
        let executor = findAliveRole('Godfather') || findAliveRole('Mafia') || findAliveRole('IdentityThief');
        if (executor && !isBlocked(executor.id)) logVisit(executor.id, mafiaTargetForVisit);
        let jp = findAliveRole('IdentityThief');
        if (jp && !isBlocked(jp.id) && executor && executor.id !== jp.id) logVisit(jp.id, mafiaTargetForVisit);
    }
    
    if (acts.serialkiller) {
        let skp = findAliveRole('SerialKiller');
        if (skp) logVisit(skp.id, acts.serialkiller);
    }
    
    if (acts.phantom) logIfValid('Phantom', (typeof acts.phantom === 'object') ? acts.phantom.target : acts.phantom);
    if (acts.arsonist) logIfValid('Arsonist', (typeof acts.arsonist === 'object') ? acts.arsonist.target : acts.arsonist);
    if (acts.plaguedoctor) logIfValid('PlagueDoctor', acts.plaguedoctor);
    if (acts.eviltwin) logIfValid('EvilTwin', acts.eviltwin);
    if (acts.gravedigger) logIfValid('Gravedigger', (typeof acts.gravedigger === 'object') ? acts.gravedigger.kill : acts.gravedigger);
    if (acts.vigilante && acts.vigilante !== 'skip') logIfValid('Vigilante', acts.vigilante);
    if (acts.paranoiddoctor) logIfValid('ParanoidDoctor', acts.paranoiddoctor);
    if (acts.bodyguard) logIfValid('Bodyguard', acts.bodyguard);
    if (acts.doctor) logIfValid('Doctor', acts.doctor);
    if (acts.detective) logIfValid('Detective', acts.detective);
    if (acts.drunkdetective) logIfValid('DrunkDetective', acts.drunkdetective);
    if (acts.spy) logIfValid('Spy', acts.spy);
    if (acts.watcher) logIfValid('Watcher', acts.watcher);
    if (acts.escort) logIfValid('Escort', acts.escort);
    if (acts.witch) logIfValid('Witch', (typeof acts.witch === 'object') ? acts.witch.puppetId : acts.witch);

    if (acts.saboteur) {
        let sp = findAliveRole('Saboteur');
        if (sp && !isBlocked(sp.id)) {
            let target = findPlayer(acts.saboteur);
            if (target && target.isAlive) target.sabotaged = true;
        }
    }

    let framedTarget = null;
    let framerPlayer = findAliveRole('Framer');
    if (framerPlayer && !isBlocked(framerPlayer.id) && acts.framer) framedTarget = acts.framer;

    let trapTarget = null;
    if (trapperPlayer && !isBlocked(trapperPlayer.id) && acts.trapper && trapperPlayer.trapperCharges > 0) {
        trapTarget = acts.trapper;
        trapperPlayer.trapperCharges--;
    }

    if (acts.consigliere) {
        let cp = findAliveRole('Consigliere');
        if (cp && !isBlocked(cp.id)) {
            let target = findPlayer(acts.consigliere);
            if (target) hostState.tempState.consigliereResult = `${target.name} is the ${ROLES[target.role]?.name || target.role}.`;
        }
    }

    if (acts.blackmailer) {
        let bp = findAliveRole('Blackmailer');
        if (bp && !isBlocked(bp.id)) {
            let target = findPlayer(acts.blackmailer);
            if (target) {
                target.blackmailed = true;
                hostState.tempState.blackmailerResult = `${target.name} is the ${ROLES[target.role]?.name || target.role}.`;
            }
        }
    }

    let IdentityThiefPlayer = findAliveRole('IdentityThief');
    hostState.IdentityThiefActive = !!(IdentityThiefPlayer && !isBlocked(IdentityThiefPlayer.id));

    let mafiaTarget = acts.godfather || acts.mafia || acts.identitythief;
    if (mafiaTarget) {
        let executor = findAliveRole('Godfather') || findAliveRole('Mafia') || findAliveRole('IdentityThief');
        if (executor && !isBlocked(executor.id)) {
            kills.push({ victimId: mafiaTarget, killer: 'Mafia', killerId: executor.id });
        }
    }

    if (acts.serialkiller) {
        let skp = findAliveRole('SerialKiller');
        if (skp) {
            kills.push({ victimId: acts.serialkiller, killer: 'SerialKiller', killerId: skp.id });
        }
    }
    
    // ── LETHAL RISKS ──
    if (acts.escort) {
        let ep = findAliveRole('Escort');
        if (ep && !isBlocked(ep.id)) {
            let target = findPlayer(acts.escort);
            if (target && target.role === 'SerialKiller') {
                kills.push({ victimId: ep.id, killer: 'SerialKiller', killerId: target.id, unstoppable: true });
                hostState.tempState.escortDiedToSK = true;
            } else if (target && target.role === 'ParanoidDoctor' && Math.random() < 0.5) {
                kills.push({ victimId: ep.id, killer: 'ParanoidDoctor', killerId: target.id, unstoppable: true });
                hostState.tempState.escortDiedToParanoid = true;
            }
        }
    }
    if (acts.doctor) {
        let dp = findAliveRole('Doctor');
        if (dp && !isBlocked(dp.id)) {
            let target = findPlayer(acts.doctor);
            if (target && target.role === 'SerialKiller') {
                kills.push({ victimId: dp.id, killer: 'SerialKiller', killerId: target.id, unstoppable: true });
                hostState.tempState.doctorDiedToSK = true;
            }
        }
    }
    if (acts.detective) {
        let dp = findAliveRole('Detective');
        if (dp && !isBlocked(dp.id)) {
            let target = findPlayer(acts.detective);
            if (target && target.role === 'SerialKiller') {
                kills.push({ victimId: dp.id, killer: 'SerialKiller', killerId: target.id, unstoppable: true });
                hostState.tempState.detectiveDiedToSK = true;
                acts.detective = null; // Blank the investigation so they get no result
            }
        }
    }

    if (acts.phantom) {
        let pp = findAliveRole('Phantom');
        if (pp && !isBlocked(pp.id)) {
            let phantomAct = (typeof acts.phantom === 'object') ? acts.phantom : { action: 'kill', target: acts.phantom };
            if (phantomAct.action === 'decoy' && !pp.phantomDecoyUsed && phantomAct.target) {
                pp.phantomDecoyUsed = true;
                let target = findPlayer(phantomAct.target);
                if (target && target.isAlive) target.fakeDeceased = true;
            } else if (phantomAct.target) {
                kills.push({ victimId: phantomAct.target, killer: 'Phantom', killerId: pp.id });
            }
        }
    }

    if (acts.arsonist) {
        let ap = findAliveRole('Arsonist');
        if (ap && !isBlocked(ap.id)) {
            let arsonAct = (typeof acts.arsonist === 'object') ? acts.arsonist : { action: 'douse', target: acts.arsonist };
            if (arsonAct.action === 'ignite') {
                (ap.dousedPlayers || []).forEach(dpId => {
                    let dp = findPlayer(dpId);
                    if (dp && dp.isAlive) kills.push({ victimId: dpId, killer: 'Arsonist', killerId: ap.id, unstoppable: true });
                });
                ap.dousedPlayers = [];
            } else if (arsonAct.target) {
                ap.dousedPlayers = ap.dousedPlayers || [];
                if (!ap.dousedPlayers.includes(arsonAct.target)) ap.dousedPlayers.push(arsonAct.target);
            }
        }
    }

    hostState.players.forEach(p => {
        if (p.isAlive && p.infectedNight && (hostState.dayCount - p.infectedNight >= 2)) {
            kills.push({ victimId: p.id, killer: 'Plague', killerId: null });
            delete p.infectedNight;
        }
    });
    if (acts.plaguedoctor) {
        let pdp = findAliveRole('PlagueDoctor');
        if (pdp && !isBlocked(pdp.id)) {
            let target = findPlayer(acts.plaguedoctor);
            if (target && target.isAlive && !target.infectedNight) target.infectedNight = hostState.dayCount;
        }
    }

    if (acts.eviltwin) {
        let etp = findAliveRole('EvilTwin');
        if (etp) {
            let isEnraged = etp.enragedImmunityDay === hostState.dayCount;
            if (!isBlocked(etp.id) || isEnraged) {
                kills.push({ victimId: acts.eviltwin, killer: 'EvilTwin', killerId: etp.id, unstoppable: isEnraged });
            }
        }
    }
    if (acts.gravedigger) {
        let gp = findAliveRole('Gravedigger');
        if (gp && !isBlocked(gp.id)) {
            let gAct = (typeof acts.gravedigger === 'object') ? acts.gravedigger : { kill: acts.gravedigger };
            if (gAct.kill) kills.push({ victimId: gAct.kill, killer: 'Gravedigger', killerId: gp.id });
            if (gAct.exhume) {
                let dead = findPlayer(gAct.exhume);
                if (dead && !dead.isAlive) hostState.tempState.gravediggerResult = `${dead.name} was the ${ROLES[dead.role]?.name || dead.role}.`;
            }
        }
    }

    if (acts.prophet) {
        let prop = findAliveRole('Prophet');
        if (prop && !isBlocked(prop.id)) prop.prophetPrediction = acts.prophet;
    }

    if (acts.vigilante && acts.vigilante !== 'skip') {
        let vp = findAliveRole('Vigilante');
        if (vp && !isBlocked(vp.id)) kills.push({ victimId: acts.vigilante, killer: 'Vigilante', killerId: vp.id });
    }

    if (acts.paranoiddoctor) {
        let pdp = findAliveRole('ParanoidDoctor');
        if (pdp && !isBlocked(pdp.id)) {
            if (acts.paranoiddoctor === pdp.id) {
                pdp.paranoidOutcome = 'save';
            } else {
                pdp.paranoidOutcome = Math.random() < 0.5 ? 'save' : 'kill';
                // NOTE: pdp.paranoidOutcome is deliberately NEVER included in privateData 
                // inside syncClients(). This is what ensures the role's "never know which 
                // happened" mechanic. If synced to the client, this mechanic would break.
                if (pdp.paranoidOutcome === 'kill') {
                    kills.push({ victimId: acts.paranoiddoctor, killer: 'ParanoidDoctor', killerId: pdp.id });
                }
            }
        }
    }

    let rawKillTargets = kills.map(k => k.victimId);

    if (trapTarget) {
        kills = kills.filter(k => {
            if (k.victimId === trapTarget && k.killerId) {
                if (k.unstoppable) return true;
                let killer = findPlayer(k.killerId);
                if (killer && killer.isAlive && !deaths.some(d => d.id === killer.id)) {
                    if (ALL_MAFIA_MEMBERS.includes(killer.role) || NEUTRAL_KILLERS.includes(killer.role)) {
                        killer.isAlive = false;
                        convertCursedIfNeeded(killer.role);
                        deaths.push({ name: killer.name, id: killer.id, cause: 'Caught in a trap.' });
                    }
                }
                return false;
            }
            return true;
        });
    }

    if (acts.bodyguard) {
        let bgp = findAliveRole('Bodyguard');
        if (bgp && !isBlocked(bgp.id) && acts.bodyguard !== bgp.id) {
            let bgTarget = acts.bodyguard;
            kills = kills.filter(k => {
                if (k.victimId === bgTarget) {
                    if (!deaths.some(d => d.id === bgp.id)) {
                        bgp.isAlive = false;
                        hostState.deathsSinceLastDawn = (hostState.deathsSinceLastDawn || 0) + 1;
                        convertCursedIfNeeded(bgp.role);
                        deaths.push({ name: bgp.name, id: bgp.id, cause: 'The Bodyguard gave their life.' });
                    }
                    return false;
                }
                return true;
            });
        }
    }

    if (acts.guardianangel) {
        let gap = findAliveRole('GuardianAngel');
        if (gap && !isBlocked(gap.id) && gap.guardianTarget) {
            kills = kills.filter(k => k.unstoppable || k.victimId !== gap.guardianTarget);
        }
    }

    let healedTarget = null;
    let docPlayer = findAliveRole('Doctor');
    if (docPlayer && !isBlocked(docPlayer.id) && acts.doctor && (!hostState.settings.doctorRepeatEnforced || acts.doctor !== docPlayer.lastProtected)) {
        healedTarget = acts.doctor;
        let target = findPlayer(healedTarget);
        if (target && target.infectedNight) delete target.infectedNight;
    }

    let paranoidSave = null;
    let pdPlayer = findAliveRole('ParanoidDoctor');
    if (pdPlayer && !isBlocked(pdPlayer.id) && pdPlayer.paranoidOutcome === 'save' && acts.paranoiddoctor) paranoidSave = acts.paranoiddoctor;

    let survivorVested = {};
    hostState.players.forEach(p => {
        if (p.role === 'Survivor' && p.isAlive && acts.survivor === p.id && p.survivorVests > 0) {
            survivorVested[p.id] = true;
            p.survivorVests--;
        }
    });

    let saved = false;
    kills.forEach(k => {
        if (!k.unstoppable) {
            if (k.victimId === healedTarget) { saved = true; return; }
            if (k.victimId === paranoidSave) return;
            if (survivorVested[k.victimId]) return;
        }
        
        let victim = findPlayer(k.victimId);
        if (victim && victim.role === 'Prophet' && victim.prophetAscended) return; // Immune to night kills
        if (victim && victim.role === 'Demon') return; // Immune to night kills
        if (victim && victim.role === 'EvilTwin' && victim.enragedImmunityDay === hostState.dayCount) return; // Immune to night kills
        if (victim && victim.role === 'Journalist' && victim.journalistImmunityDay === hostState.dayCount) return; // Immune to night kills for one night

        if (victim && victim.herbalistProtected && !k.unstoppable) { saved = true; victim.herbalistProtected = false; return; }
        
        if (victim && victim.isAlive && !deaths.some(d => d.id === victim.id)) {
            victim.isAlive = false;
            convertCursedIfNeeded(victim.role);
            
            let deathEntry = { name: victim.name, id: victim.id };
            
            if (k.killer === 'Mafia' && hostState.IdentityThiefActive) {
                let it = hostState.players.find(p => p.role === 'IdentityThief' && p.isAlive);
                if (it && !it.stolenRole && victim.role !== 'Villager' && victim.role !== 'Mayor') {
                    it.stolenRole = victim.role;
                    hostState.tempState.IdentityThiefResult = `You stole the identity of the ${ROLES[victim.role]?.name || victim.role}. You can now use their power at night.`;
                }
            }
            
            deaths.push(deathEntry);

            if (k.killer === 'Vigilante' && TOWN_ROLES.includes(victim.role)) {
                let vig = findAliveRole('Vigilante');
                if (vig) vig.vigilanteGuilt = true;
            }
        }
    });

    hostState.players.forEach(p => { if (p.role === 'Doctor') p.lastProtected = healedTarget; });

    if (acts.detective) {
        let detp = findAliveRole('Detective');
        if (detp && !isBlocked(detp.id)) {
            let susp = findPlayer(acts.detective);
            if (susp) {
                let isEvil = ALL_MAFIA_MEMBERS.includes(susp.role) || NEUTRAL_KILLERS.includes(susp.role) || susp.role === 'Witch';
                if (framedTarget === susp.id) isEvil = true;
                if (susp.role === 'Godfather') isEvil = false;
                if (susp.role === 'ParanoidDoctor') isEvil = false;
                hostState.tempState.detResult = isEvil ? `${susp.name} is suspicious.` : `${susp.name} appears innocent.`;
            }
        }
    }

    if (acts.drunkdetective) {
        let ddp = findAliveRole('DrunkDetective');
        if (ddp && !isBlocked(ddp.id)) {
            let susp = findPlayer(acts.drunkdetective);
            if (susp) {
                let isEvil = ALL_MAFIA_MEMBERS.includes(susp.role) || NEUTRAL_KILLERS.includes(susp.role) || susp.role === 'Witch';
                if (framedTarget === susp.id) isEvil = true;
                if (susp.role === 'Godfather') isEvil = false;
                if (Math.random() < 0.5) isEvil = !isEvil;
                hostState.tempState.drunkDetResult = isEvil ? `${susp.name} is suspicious.` : `${susp.name} appears innocent.`;
            }
        }
    }

    if (acts.stalker) {
        let stp = findAliveRole('Stalker');
        if (stp && !isBlocked(stp.id)) {
            let target = findPlayer(acts.stalker);
            if (target) hostState.tempState.stalkerResult = `${target.name} is the ${ROLES[target.role]?.name || target.role}.`;
        }
    }

    if (acts.spy) {
        let spyp = findAliveRole('Spy');
        if (spyp && !isBlocked(spyp.id)) {
            let spyTarget = acts.spy;
            let targetVisits = visits[spyTarget] || [];
            let otherVisits = targetVisits.filter(v => v.id !== spyp.id);
            let targetName = getName(spyTarget);
            if (otherVisits.length > 0) {
                let rolesStr = otherVisits.map(v => ROLES[v.role]?.name || v.role).join(' and a ');
                hostState.tempState.spyResult = `A ${rolesStr} visited ${targetName}!`;
            } else {
                hostState.tempState.spyResult = `No one visited ${targetName} tonight.`;
            }
        }
    }

    if (acts.watcher) {
        let wp = findAliveRole('Watcher');
        if (wp && !isBlocked(wp.id)) {
            let watchTarget = acts.watcher;
            let targetVisits = visits[watchTarget] || [];
            let otherVisits = targetVisits.filter(v => v.id !== wp.id);
            let targetName = getName(watchTarget);
            if (otherVisits.length > 0) {
                let namesStr = otherVisits.map(v => v.name).join(' and ');
                hostState.tempState.watcherResult = `${namesStr} visited ${targetName} tonight!`;
            } else {
                hostState.tempState.watcherResult = `No one visited ${targetName} tonight.`;
            }
        }
    }

    hostState.players.forEach(p => {
        if (p.role === 'Executioner' && p.isAlive && p.executionerTarget) {
            let target = findPlayer(p.executionerTarget);
            if (target && !target.isAlive) {
                if (target.id === hostState.tempState.eliminated?.id) {
                    // Won this vote! Wait for finalizeVote to process it instead of becoming Jester immediately
                } else {
                    p.role = 'Jester';
                    delete p.executionerTarget;
                }
            }
        }
    });

    hostState.players.forEach(p => {
        if (p.fakeDeceased && !deaths.some(d => d.id === p.id)) {
            deaths.push({ name: p.name, id: p.id, fakeDeceased: true });
        }
    });

    if (hostState.phantomReturns && hostState.phantomReturns.length > 0) {
        hostState.tempState.phantomReturns = [...hostState.phantomReturns];
        hostState.phantomReturns = [];
    }

    let prophet = hostState.players.find(p => p.role === 'Prophet' && p.isAlive && p.prophetPrediction);
    if (prophet) {
        if (!prophet.prophetAscended && deaths.some(d => d.id === prophet.prophetPrediction)) {
            prophet.prophetAscended = true;
            hostState.tempState.prophetAscensionMessage = true;
        }
        prophet.prophetPrediction = null;
    }

    if (acts.demon) {
        let dp = findAliveRole('Demon');
        if (dp && !isBlocked(dp.id)) {
            let act = typeof acts.demon === 'object' ? acts.demon : null;
            if (act) {
                if (act.action === 'resurrect' && !dp.demonResurrectUsed) {
                    let deadP = findPlayer(act.target);
                    if (deadP && !deadP.isAlive) {
                        deadP.isAlive = true;
                        dp.demonResurrectUsed = true;
                        hostState.phantomReturns = hostState.phantomReturns || [];
                        hostState.phantomReturns.push(deadP.name); 
                    }
                } else if (act.action === 'shuffle' && !dp.demonShuffleUsed) {
                    let shufflers = hostState.players.filter(p => p.isAlive && p.role !== 'Demon' && !p.fakeDeceased);
                    let roles = shufflers.map(p => p.role);
                    for (let i = roles.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [roles[i], roles[j]] = [roles[j], roles[i]];
                    }
                    shufflers.forEach((p, idx) => {
                        p.role = roles[idx];
                        p.demonShuffled = true;
                        initializeRoleState(p);
                    });
                    dp.demonShuffleUsed = true;
                }
            }
        }
    }

    hostState.tempState.deaths = deaths;
    hostState.tempState.saved = saved;
    
    hostState.dealtRoles = [...new Set(hostState.players.map(p => p.role))];

    hostState.phase = 'DAWN';
    syncClients();
}

/* ==========================================================================
   VOTE & ELIMINATION LOGIC
   ========================================================================== */
window.finalizeVote = function() {
    hostState.timerEndsAt = null;
    let votes = {};
    hostState.players.forEach(p => { 
        if (p.voteTarget && p.isAlive) {
            let weight = (p.mayorRevealed) ? 3 : 1;
            votes[p.voteTarget] = (votes[p.voteTarget] || 0) + weight;
        }
    });
    let max = 0, targetId = null, tie = false;
    for (let id in votes) {
        if (votes[id] > max) { max = votes[id]; targetId = id; tie = false; }
        else if (votes[id] === max) { tie = true; }
    }
    
    if (max === 0 || tie) hostState.tempState.eliminated = null;
    else {
        let p = hostState.players.find(p => p.id === targetId);
        if(p) {
            p.herbalistPoisoned = false; // Clear poison since they died to vote
            p.isAlive = false; 
            hostState.deathsSinceLastDawn = (hostState.deathsSinceLastDawn || 0) + 1;
            convertCursedIfNeeded(p.role);
            hostState.tempState.eliminated = { id: p.id, name: p.name }; 

            let gameOverTriggered = null;

            let exec = hostState.players.find(x => x.role === 'Executioner' && x.isAlive && x.executionerTarget === p.id);
            if (exec) {
                hostState.tempState.executionerWin = [exec.name];
                // Executioner wins, but the game continues unless Jester also ends it
            }

            if (p.role === 'Jester') {
                hostState.tempState.jesterWin = [p.name];
                gameOverTriggered = { id: 'JESTER_WIN', jesterId: p.id, team: 'Neutral', title: 'The Jester Wins!' };
            }
            
            if (gameOverTriggered) {
                triggerGameOver(gameOverTriggered); return;
            }

            if (p.role === 'InnocentTwin') {
                hostState.tempState.enragedTwin = true;
                let et = hostState.players.find(x => x.role === 'EvilTwin' && x.isAlive);
                if (et) et.enragedImmunityDay = hostState.dayCount;
            }
        }
    }



    hostState.players.forEach(p => {
        if (p.isAlive && p.herbalistPoisoned) {
            p.isAlive = false;
            p.herbalistPoisoned = false;
            convertCursedIfNeeded(p.role);
            hostState.tempState.herbalistPoisonKill = { name: p.name };
        }
    });
    
    hostState.phase = 'ELIMINATION'; 
    syncClients();
}

/* ==========================================================================
   RENDERER & VIEWS 
   ========================================================================== */
let renderTimer = null;
function render() {
    if (renderTimer) return;
    renderTimer = requestAnimationFrame(() => {
        renderTimer = null;
        _render();
    });
}

function _render() {
    let html = ''; let cs = clientState;
    if (cs.phase === 'MENU') html = tplMenu(cs);
    else if (cs.phase === 'CONNECTING') html = `<div class="screen" style="align-items:center;"><div class="loader"></div><p class="text-dim">Establishing connection...</p></div>`;
    else if (cs.phase === 'LOBBY') html = tplLobby(cs);
    else if (cs.phase === 'ROLE_DEAL') html = tplRoleDeal(cs);
    else if (cs.phase === 'NIGHT') html = tplNight(cs);
    else if (cs.phase === 'DAWN') html = tplDawn(cs);
    else if (cs.phase === 'DAY') html = tplDay(cs);
    else if (cs.phase === 'VOTE') html = tplVote(cs);
    else if (cs.phase === 'ELIMINATION') html = tplElim(cs);
    else if (cs.phase === 'GAME_OVER') html = tplGameOver(cs);

    let hostControlsHTML = (net.isHost && ['DAWN', 'DAY', 'VOTE', 'ELIMINATION', 'GAME_OVER'].includes(cs.phase)) ? renderHostControls(cs.phase) : '';
    
    app.innerHTML = `<div class="content-wrapper">${html}</div>` + hostControlsHTML;
    
    let topNav = document.getElementById('top-nav');
    if (cs.phase !== 'MENU' && cs.phase !== 'CONNECTING') {
        topNav.style.display = 'flex';
        document.getElementById('nav-room-code').innerText = cs.roomCode || '----';
    } else {
        topNav.style.display = 'none';
    }
    
    renderRulebook();
}

let rulebookSearch = '';
function renderRulebook() {
    let modal = document.getElementById('rulebook-modal');
    if (!clientState.showRulebook) {
        modal.classList.remove('show');
        setTimeout(() => { if (!clientState.showRulebook) modal.innerHTML = ''; }, 300);
        return;
    }
    
    let query = rulebookSearch.toLowerCase().trim();
    let keys = Object.keys(ROLES).filter(r => !ROLES[r]._internal);
    
    let groups = { Town: [], Mafia: [], Neutral: [] };
    keys.forEach(k => {
        let r = ROLES[k];
        if (query && !r.name.toLowerCase().includes(query) && !r.desc.toLowerCase().includes(query) && !r.team.toLowerCase().includes(query)) return;
        if (groups[r.team]) groups[r.team].push(r);
    });
    
    let html = `<div class="rulebook-header">
        <h2 class="serif" style="color:var(--gold); font-size:24px;">Encyclopedia</h2>
        <button class="rulebook-close" data-action="toggle-rulebook">✕</button>
    </div>
    <div class="rulebook-content">
        <input type="text" class="search-bar" id="rulebook-search" placeholder="Search roles, teams, or mechanics..." value="${rulebookSearch}">`;
        
    ['Town', 'Mafia', 'Neutral'].forEach(team => {
        if (groups[team].length === 0) return;
        html += `<h3 style="color:${TEAM_COLORS[team]}; margin: 24px 0 12px 0; border-bottom: 1px solid var(--border); padding-bottom: 8px;">${team}</h3>`;
        groups[team].forEach(r => {
            let tClass = team.toLowerCase();
            html += `<div class="role-entry ${tClass}">
                <div class="role-entry-team" style="color:${TEAM_COLORS[team]}">${team}</div>
                <div class="role-entry-title" style="color:var(--ink);">${r.name}</div>
                <div class="role-entry-desc">${r.desc}</div>
                <div class="role-entry-win">Goal: ${r.win}</div>
            </div>`;
        });
    });
    
    html += `</div>`;
    
    let wasEmpty = modal.innerHTML === '';
    modal.innerHTML = html;
    if (wasEmpty) modal.classList.add('show');
    
    let sInput = document.getElementById('rulebook-search');
    if (sInput) {
        sInput.focus();
        let val = sInput.value;
        sInput.value = ''; sInput.value = val; // cursor to end
    }
}

/* ── MENU ── */
function tplMenu(cs) { 
    return `<div class="screen screen-top"><h1 class="title-huge italic" style="margin-top:20px;">Mafia</h1><p class="subtitle">A web-based game of deception.</p>${cs.error ? `<div class="card" style="border-color:var(--blood); padding:16px; margin-bottom:24px; box-shadow:0 0 15px rgba(163,29,29,0.2);"><div style="color:var(--blood-lit); font-weight:600;">${cs.error}</div></div>` : ''}<div class="card" style="margin-bottom:24px;"><input type="text" id="player-name" placeholder="Your Name" maxlength="12"><div style="height:1px; background:var(--border); margin:20px 0;"></div><button class="btn-primary" data-action="host-setup" style="margin-bottom:16px;">Host New Game</button><div style="display:flex; gap:12px;"><input type="text" id="room-code" placeholder="ROOM CODE" maxlength="4" style="margin-bottom:0;"><button data-action="join-setup" style="width:auto; padding:0 32px;">Join</button></div></div></div>`; 
}

/* ── LOBBY ── */
function tplLobby(cs) { 
    let setupUI = '';
    if (net.isHost) {
        let mode = hostState.roleMode;
        
        let modeToggle = `<div class="mode-toggle">
            <button class="${mode === 'classic' ? 'active' : ''}" data-action="set-role-mode" data-val="classic">⚙ Classic</button>
            <button class="${mode === 'pool' ? 'active' : ''}" data-action="set-role-mode" data-val="pool">🃏 Pool Builder</button>
        </div>`;

        if (mode === 'classic') {
            let roleChecks = Object.keys(ROLES).filter(r => !ROLES[r]._internal).map(r => {
                let isChecked = hostState.activeRoles.includes(r);
                let color = TEAM_COLORS[ROLES[r].team];
                let prefix = ROLES[r].variant ? '<span style="opacity:0.5; font-size:10px;">⟳</span> ' : '';
                return `<div class="role-toggle ${isChecked ? 'active' : ''}" data-action="toggle-role" data-val="${r}" style="${isChecked ? `border-color:${color};color:${color};` : ''}">${prefix}${ROLES[r].name}</div>`;
            }).join('');

            setupUI = `<div class="card" style="margin-top:24px; padding:24px; text-align:left;">
                <div style="font-size:12px; color:var(--gold); text-transform:uppercase; margin-bottom:20px; letter-spacing:0.1em; font-weight:600; text-align:center;">Game Configuration</div>
                ${modeToggle}
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; margin-bottom:24px;">
                    <div style="text-align:center;">
                        <div style="font-size:10px; color:var(--ink-dim); text-transform:uppercase; margin-bottom:8px;">Discuss</div>
                        <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                            <button class="btn-preset" data-action="adj-time" data-val="discuss|-15" style="padding:4px 8px; font-size:16px;">-</button>
                            <span style="font-weight:600; width:30px;">${cs.settings.discussTime}s</span>
                            <button class="btn-preset" data-action="adj-time" data-val="discuss|15" style="padding:4px 8px; font-size:16px;">+</button>
                        </div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:10px; color:var(--ink-dim); text-transform:uppercase; margin-bottom:8px;">Vote</div>
                        <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                            <button class="btn-preset" data-action="adj-time" data-val="vote|-15" style="padding:4px 8px; font-size:16px;">-</button>
                            <span style="font-weight:600; width:30px;">${cs.settings.voteTime}s</span>
                            <button class="btn-preset" data-action="adj-time" data-val="vote|15" style="padding:4px 8px; font-size:16px;">+</button>
                        </div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:10px; color:var(--blood-lit); text-transform:uppercase; margin-bottom:8px;">Mafias</div>
                        <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                            <button class="btn-preset" data-action="adj-mafia" data-val="-1" style="padding:4px 8px; font-size:16px;">-</button>
                            <span style="font-weight:600; width:35px; color:var(--blood-lit);">${cs.settings.mafiaCount === -1 ? 'AUTO' : cs.settings.mafiaCount}</span>
                            <button class="btn-preset" data-action="adj-mafia" data-val="1" style="padding:4px 8px; font-size:16px;">+</button>
                        </div>
                    </div>
                </div>
                <div style="text-align:center; margin-bottom:20px;">
                    <div class="role-toggle ${cs.settings.botsCanBeMafia ? 'active' : ''}" data-action="toggle-setting" data-val="botsCanBeMafia" style="border-color:var(--blood-lit); color: ${cs.settings.botsCanBeMafia ? 'var(--blood-lit)' : 'var(--ink-dim)'}; display:flex; align-items:center; gap:6px;">
                        ${cs.settings.botsCanBeMafia ? '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg> Bots CAN be Evil' : '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg> Bots CANNOT be Evil'}
                    </div>
                    <div class="role-toggle ${cs.settings.hostPriority ? 'active' : ''}" data-action="toggle-setting" data-val="hostPriority" style="border-color:var(--gold); color: ${cs.settings.hostPriority ? 'var(--gold)' : 'var(--ink-dim)'}; display:inline-flex; align-items:center; gap:6px;">
                        Host Priority
                    </div>
                    <div class="role-toggle ${cs.settings.doctorRepeatEnforced ? 'active' : ''}" data-action="toggle-setting" data-val="doctorRepeatEnforced" style="border-color:var(--sky); color: ${cs.settings.doctorRepeatEnforced ? 'var(--sky)' : 'var(--ink-dim)'};">
                        ${cs.settings.doctorRepeatEnforced ? '🩺 Doctor Repeat: OFF' : '🩺 Doctor Repeat: ON'}
                    </div>
                </div>
                <div style="display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; justify-content:center;">
                    ${Object.keys(PRESETS).map(k => `<button class="btn-preset" data-action="set-preset-classic" data-val="${k}">${k}</button>`).join('')}
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">${roleChecks}</div>
            </div>`;
        } else {
            let playerCount = hostState.players.length;
            let poolCount = hostState.rolePool.length;
            let diff = playerCount - poolCount;
            let canStart = poolCount === playerCount && poolCount >= 3 
                && hostState.rolePool.includes('Villager');

            let roleListHTML = '';
            for (let [teamName, roles] of Object.entries(POOL_ROLES_ORDERED)) {
                let teamColor = TEAM_COLORS[teamName];
                roleListHTML += `<div class="pool-section-header" style="color:${teamColor};"><div class="dot" style="background:${teamColor};"></div>${teamName}</div>`;
                roles.forEach(r => {
                    let rd = ROLES[r];
                    let count = countInPool(r);
                    let isFixed = (r === 'Villager' || r === 'Mafia');
                    let minCount = isFixed ? 1 : 0;
                    let variantPrefix = rd.variant ? `<span class="role-variant-prefix">⟳</span>` : '';
                    let subtitle = rd.replacesLabel ? `<div class="role-sub">replaces ${rd.replacesLabel}</div>` : '';
                    roleListHTML += `<div class="pool-role-row">
                        <div class="dot" style="width:6px; height:6px; border-radius:50%; background:${teamColor}; flex-shrink:0;"></div>
                        <div class="role-info">${variantPrefix}<span class="role-name">${rd.name}</span>${subtitle}</div>
                        <div class="count-badge" style="${count > 0 ? 'border-color:' + teamColor + ';' : ''}">${count}</div>
                        <button class="pool-btn" data-action="pool-remove" data-val="${r}" ${count <= minCount ? 'disabled' : ''}>−</button>
                        <button class="pool-btn" data-action="pool-add" data-val="${r}" ${cs.settings.poolBuilderCaps && !isFixed && count >= 3 ? 'disabled' : ''}>+</button>
                    </div>`;
                });
            }

            let pillsHTML = hostState.rolePool.length === 0 
                ? `<span style="color:var(--ink-ghost); font-size:12px; font-style:italic;">Empty pool — add roles above</span>`
                : hostState.rolePool.map((r, i) => {
                    let color = TEAM_COLORS[ROLES[r]?.team || 'Neutral'];
                    return `<div class="pool-pill" style="border-color:${color}; color:${color};" data-action="pool-pill-remove" data-val="${i}">${ROLES[r]?.name || r}</div>`;
                }).join('');

            let statusText = diff > 0 ? `Need ${diff} more card${diff>1?'s':''}` : diff < 0 ? `Remove ${-diff} card${-diff>1?'s':''}` : 'Ready';
            let statusColor = diff === 0 ? 'var(--sage)' : 'var(--blood-lit)';

            setupUI = `<div class="card" style="margin-top:24px; padding:24px; text-align:left;">
                <div style="font-size:12px; color:var(--gold); text-transform:uppercase; margin-bottom:20px; letter-spacing:0.1em; font-weight:600; text-align:center;">Role Pool Builder</div>
                ${modeToggle}
                <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; margin-bottom:16px;">
                    <div style="text-align:center;">
                        <div style="font-size:10px; color:var(--ink-dim); text-transform:uppercase; margin-bottom:8px;">Discuss</div>
                        <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                            <button class="pool-btn" data-action="adj-time" data-val="discuss|-15" style="width:24px;height:24px;font-size:14px;">-</button>
                            <span style="font-weight:600; width:30px; font-size:13px;">${cs.settings.discussTime}s</span>
                            <button class="pool-btn" data-action="adj-time" data-val="discuss|15" style="width:24px;height:24px;font-size:14px;">+</button>
                        </div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:10px; color:var(--ink-dim); text-transform:uppercase; margin-bottom:8px;">Vote</div>
                        <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                            <button class="pool-btn" data-action="adj-time" data-val="vote|-15" style="width:24px;height:24px;font-size:14px;">-</button>
                            <span style="font-weight:600; width:30px; font-size:13px;">${cs.settings.voteTime}s</span>
                            <button class="pool-btn" data-action="adj-time" data-val="vote|15" style="width:24px;height:24px;font-size:14px;">+</button>
                        </div>
                    </div>
                </div>
                <div style="text-align:center; margin-bottom:16px;">
                    <div class="role-toggle ${cs.settings.botsCanBeMafia ? 'active' : ''}" data-action="toggle-setting" data-val="botsCanBeMafia" style="border-color:var(--blood-lit); color: ${cs.settings.botsCanBeMafia ? 'var(--blood-lit)' : 'var(--ink-dim)'}; margin-right: 4px; margin-bottom: 4px; display:flex; align-items:center; gap:6px;">
                        ${cs.settings.botsCanBeMafia ? '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg> Bots CAN be Evil' : '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg> Bots CANNOT be Evil'}
                    </div>
                    <div class="role-toggle ${cs.settings.hostPriority ? 'active' : ''}" data-action="toggle-setting" data-val="hostPriority" style="border-color:var(--gold); color: ${cs.settings.hostPriority ? 'var(--gold)' : 'var(--ink-dim)'}; margin-right: 4px; margin-bottom: 4px; display:inline-flex; align-items:center; gap:6px;">
                        Host Priority
                    </div>
                    <div class="role-toggle ${cs.settings.doctorRepeatEnforced ? 'active' : ''}" data-action="toggle-setting" data-val="doctorRepeatEnforced" style="border-color:var(--sky); color: ${cs.settings.doctorRepeatEnforced ? 'var(--sky)' : 'var(--ink-dim)'}; margin-right: 4px; margin-bottom: 4px;">
                        ${cs.settings.doctorRepeatEnforced ? '🩺 Doctor Repeat: OFF' : '🩺 Doctor Repeat: ON'}
                    </div>
                    <div class="role-toggle ${cs.settings.poolBuilderCaps ? 'active' : ''}" data-action="toggle-setting" data-val="poolBuilderCaps" style="border-color:var(--gold); color: ${cs.settings.poolBuilderCaps ? 'var(--gold)' : 'var(--ink-dim)'};">
                        ${cs.settings.poolBuilderCaps ? '⚗️ Pool Caps: ON' : '⚗️ Pool Caps: OFF'}
                    </div>
                </div>
                <div style="display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap; justify-content:center;">
                    ${Object.keys(PRESETS).map(k => `<button class="btn-preset" data-action="set-preset-pool" data-val="${k}" style="font-size:10px; padding:6px 10px;">${k}</button>`).join('')}
                </div>
                <div style="max-height:280px; overflow-y:auto; padding-right:4px; margin-bottom:8px; scrollbar-width:thin;">
                    ${roleListHTML}
                </div>
                <div style="font-size:11px; color:var(--ink-ghost); text-transform:uppercase; letter-spacing:0.08em; margin-top:16px; margin-bottom:4px;">Pool Preview</div>
                <div class="pool-pills">${pillsHTML}</div>
                <div class="pool-status-bar">
                    <span>Pool: <b>${poolCount}</b> / <b>${playerCount}</b> players</span>
                    <span style="color:${statusColor}; font-weight:600;">${statusText}</span>
                </div>
            </div>`;
        }
    } else {
        let summary = cs.poolSummary || { town: 0, mafia: 0, neutral: 0 };
        let modeLabel = cs.roleMode === 'pool' ? 'Pool Builder' : 'Classic';
        setupUI = `<div class="card" style="margin-top:24px; padding:20px;">
            <div style="font-size:12px; color:var(--ink-ghost); text-transform:uppercase; margin-bottom:12px; letter-spacing:0.1em;">Game Setup (${modeLabel})</div>
            ${cs.roleMode === 'pool' 
                ? `<div style="font-size:16px; font-weight:600; margin-bottom:8px;">
                    <span style="color:var(--gold);">${summary.town} Town</span> · 
                    <span style="color:var(--blood-lit);">${summary.mafia} Mafia</span> · 
                    <span style="color:var(--neutral);">${summary.neutral} Neutral</span>
                   </div>`
                : `<div style="color:var(--ink-dim); font-size:14px; line-height:1.6;">${(cs.activeRoles || []).map(r => ROLES[r]?.name || r).join(' • ')}</div>`
            }
            <div style="margin-top:16px; font-size:12px; color:var(--ink-ghost);">Day: ${cs.settings.discussTime}s | Vote: ${cs.settings.voteTime}s${cs.roleMode === 'classic' ? ` | Mafia: ${cs.settings.mafiaCount === -1 ? 'Auto' : cs.settings.mafiaCount}` : ''}</div>
        </div>`;
    }

    let canStartClassic = hostState.roleMode === 'classic' && cs.players.length >= 3;
    let canStartPool = hostState.roleMode === 'pool' && hostState.rolePool.length === cs.players.length && cs.players.length >= 3
        && hostState.rolePool.includes('Villager');
    let canStart = net.isHost && (canStartClassic || canStartPool);

    let hostStartRow = net.isHost ? `
        <div style="display:flex; gap:8px; margin-top:24px;">
            <button class="btn-primary" data-action="host-start" ${canStart ? '' : 'disabled'}>Start Game</button>
            <button class="btn-preset" data-action="add-bot" style="border-color:var(--sage); color:var(--sage); max-width:120px;">+ Add Bot</button>
        </div>
        ${cs.players.length < 3 ? `<p class="text-center text-dim" style="margin-top:16px; font-size:13px;">Waiting for players (min 3)</p>` : ''}
    ` : `<div class="text-center text-dim" style="padding: 20px;">Waiting for host to start the game...</div>`;

    let leaderboardHTML = '';
    if (cs.leaderboard && Object.keys(cs.leaderboard).length > 0) {
        let entries = Object.entries(cs.leaderboard)
            .map(([name, stats]) => ({ name, games: stats.games, wins: stats.wins }))
            .sort((a, b) => b.wins - a.wins);
        leaderboardHTML = `<div class="card" style="margin-top:24px; padding:20px;">
            <div style="font-size:12px; color:var(--gold); text-transform:uppercase; margin-bottom:12px; letter-spacing:0.1em; font-weight:600; text-align:center;">🏆 Leaderboard</div>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${entries.map((e, i) => `<div style="display:flex; justify-content:space-between; font-size:13px; padding:8px; background:rgba(0,0,0,0.2); border-radius:6px;">
                    <span><b>${i+1}.</b> ${e.name}</span>
                    <span style="color:var(--ink-dim);"><b style="color:var(--gold);">${e.wins}</b> Wins <span style="font-size:10px;">(${e.games} games)</span></span>
                </div>`).join('')}
            </div>
        </div>`;
    }

    return `<div class="screen screen-top"><div class="text-center text-dim" style="font-size:12px; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:8px;">Room Code</div><h1 class="title-huge" style="letter-spacing:0.15em;">${cs.roomCode}</h1><div class="list" style="margin-top:24px;">${cs.players.map(p => {
        let youTxt = p.id === net.myId ? '(YOU)' : '';
        let kickBtn = (net.isHost && p.id !== net.myId) ? `<button data-action="kick-player" data-val="${p.id}" style="padding:4px 8px; font-size:10px; width:auto; border-color:var(--blood); color:var(--blood); background:transparent; margin-left:10px;">Kick</button>` : '';
        return `<div class="list-item"><span style="display:flex; align-items:center; gap:6px;">${p.isBot?'<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>':''}${p.name}</span> <div style="display:flex; align-items:center;"><span style="color:var(--ink-ghost); font-size:12px;">${youTxt}</span>${kickBtn}</div></div>`;
    }).join('')}</div>${leaderboardHTML}${setupUI}<div class="spacer" style="min-height:24px;"></div>${hostStartRow}</div>`; 
}

/* ── ROLE DEAL (Tarot Card Style) ── */
function tplRoleDeal(cs) { 
    if (!cs.me || cs.me.ready) return `<div class="screen" style="align-items:center;"><div class="loader"></div><p class="text-dim">Waiting for others to acknowledge...</p></div>`; 
    let r = ROLES[cs.me.role]; 
    if (!r) return `<div class="screen" style="align-items:center;"><p class="text-dim">Loading role...</p></div>`;
    let teamColor = TEAM_COLORS[r.team];
    
    let hash = 0;
    for (let i = 0; i < r.name.length; i++) hash = r.name.charCodeAt(i) + ((hash << 5) - hash);
    let h = Math.abs(hash) % 360;
    let bgPattern = '';
    if (r.team === 'Town') bgPattern = `radial-gradient(circle at top right, hsla(${h}, 70%, 20%, 0.4) 0%, transparent 60%), radial-gradient(circle at bottom left, hsla(${(h + 180) % 360}, 50%, 15%, 0.3) 0%, transparent 50%), var(--bg-glass)`;
    else if (r.team === 'Mafia') bgPattern = `repeating-linear-gradient(${h % 180}deg, transparent, transparent 10px, rgba(163,29,29,0.03) 10px, rgba(163,29,29,0.03) 20px), radial-gradient(circle at center, hsla(${h}, 50%, 15%, 0.8) 0%, rgba(10,9,8,0.95) 100%)`;
    else bgPattern = `radial-gradient(circle at center, hsla(${h}, 30%, 20%, 0.5) 0%, transparent 80%), repeating-radial-gradient(circle at center, transparent, transparent 5px, rgba(140,140,140,0.02) 6px, rgba(140,140,140,0.02) 10px), var(--bg-glass)`;

    let mates = cs.mafiaMates && cs.mafiaMates.length > 0 ? `<div style="margin-top:24px; padding:16px; background:rgba(163,29,29,0.1); border:1px solid rgba(163,29,29,0.3); border-radius:8px; font-size:14px; color:var(--blood-lit);"><b>Your allies:</b><br>${cs.mafiaMates.join(', ')}</div>` : '';
    
    let extraInfo = '';
    if (cs.me.role === 'Executioner' && cs.me.executionerTargetName) extraInfo = `<div style="margin-top:16px; padding:12px; background:rgba(140,140,140,0.1); border:1px solid rgba(140,140,140,0.3); border-radius:8px; font-size:14px; color:var(--neutral);"><b>Your target:</b> ${cs.me.executionerTargetName}</div>`;
    if (cs.me.role === 'GuardianAngel' && cs.me.guardianTargetName) extraInfo = `<div style="margin-top:16px; padding:12px; background:rgba(201,167,20,0.1); border:1px solid rgba(201,167,20,0.3); border-radius:8px; font-size:14px; color:var(--gold);"><b>Your ward:</b> ${cs.me.guardianTargetName}</div>`;
    if (cs.me.role === 'InnocentTwin' && cs.me.twinName) extraInfo = `<div style="margin-top:16px; padding:12px; background:rgba(163,29,29,0.1); border:1px solid rgba(163,29,29,0.3); border-radius:8px; font-size:14px; color:var(--blood-lit);"><b>The Evil Twin is:</b> ${cs.me.twinName}</div>`;
    if (cs.me.role === 'EvilTwin' && cs.me.twinName) extraInfo = `<div style="margin-top:16px; padding:12px; background:rgba(201,167,20,0.1); border:1px solid rgba(201,167,20,0.3); border-radius:8px; font-size:14px; color:var(--gold);"><b>The Innocent Twin is:</b> ${cs.me.twinName}</div>`;
    if (cs.me.role === 'Prophet' && cs.me.townRoles) {
        extraInfo = `<div style="margin-top:16px; padding:12px; background:rgba(140,140,140,0.08); border:1px solid rgba(140,140,140,0.2); border-radius:8px; font-size:12px; color:var(--ink-dim);"><b style="color:var(--gold);">Town Roles:</b><br>${cs.me.townRoles.map(x => `${x.name} — ${x.role}`).join('<br>')}</div>`;
        if (cs.me.prophetAscended) extraInfo += `<div style="margin-top:16px; padding:12px; background:rgba(138,43,226,0.1); border:1px solid rgba(138,43,226,0.3); border-radius:8px; font-size:14px; color:var(--violet);">Your prophecy was fulfilled! You are immune to night attacks.</div>`;
    }

    let symbol = r.team === 'Town' ? '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' : r.team === 'Mafia' ? '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' : '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';

    return `<div class="screen"><div class="tarot-card" style="padding:48px 24px; border-color:${teamColor}; margin-top:20px; background:${bgPattern}; box-shadow: inset 0 0 40px rgba(0,0,0,0.8), 0 8px 32px rgba(0,0,0,0.6);">
        <div class="tarot-corner tl">✧</div><div class="tarot-corner tr">✧</div>
        <div class="tarot-corner bl">✧</div><div class="tarot-corner br">✧</div>
        <div class="tarot-symbol" style="color:${teamColor};">${symbol}</div>
        <div class="team-badge" style="border-color:${teamColor}; color:${teamColor};">◆ ${r.team} ◆</div>
        <div class="subtitle" style="margin-bottom:0; font-size:14px;">You are the</div>
        <h2 class="title-huge italic" style="color:${teamColor}; margin-top:8px; margin-bottom:0; text-shadow:0 0 30px ${teamColor}40;">${r.name}</h2>
        <div class="tarot-divider"></div>
        <p style="font-size:15px; line-height:1.7; color:var(--ink);">${r.desc}</p>
        <p style="margin-top:16px; font-size:13px; color:var(--ink-dim); font-weight:500;">Goal: ${r.win}</p>
        ${mates}${extraInfo}
    </div><div class="spacer"></div><button class="btn-primary" data-action="ready">I Understand</button></div>`; 
}

/* ── NIGHT ── */
function tplNight(cs) { 
    let banner = getRoleBannerHTML(cs);
    if (!cs.me || !cs.me.isAlive) {
        return `<div class="screen" style="align-items:center;">${banner}<div class="spacer"></div><div class="candle-container" style="opacity:0.3;"><div class="candle"><div class="flame" style="animation:none; opacity:0.1;"></div></div></div><h1 class="title-huge italic" style="color:var(--ink-ghost);">The town sleeps.</h1><p class="text-dim">Waiting for the ${cs.currentNightRole || '...'} to act...</p></div>`;
    }
    
    let activeRole = (cs.me.role === 'IdentityThief' && cs.me.stolenRole) ? cs.me.stolenRole : cs.me.role;
    let roleGroupName = getRoleGroupNameClient(activeRole);
    let isMyTurn = roleGroupName === cs.currentNightRole && !cs.me.ready; 
    
    if (!isMyTurn) { 
        return `<div class="screen" style="align-items:center;">${banner}<div class="spacer"></div><div class="candle-container"><div class="candle"><div class="flame"></div></div></div><h1 class="title-huge italic">The town sleeps.</h1><p class="text-dim">Waiting for the ${cs.currentNightRole || '...'} to act...</p></div>`; 
    } 
    
    let rDef = ROLES[activeRole]; 
    if (!rDef) return '';
    let isMafiaTeam = ALL_MAFIA_MEMBERS.includes(activeRole);
    let sel = isMafiaTeam ? cs.mafiaTarget : (cs.me.nightTarget || null);
    let teamColor = TEAM_COLORS[rDef.team];
    let alivePlayers = cs.players.filter(p => p.isAlive);
    
    if (activeRole === 'Survivor') {
        let vests = cs.me.survivorVests ?? 0;
        return `<div class="screen screen-top">
            <h2 class="title italic" style="color:${teamColor}; font-size:42px;">Survivor</h2>
            <p class="subtitle">Vests remaining: <b style="color:var(--gold);">${vests}</b></p>
            ${vests > 0 ? `<button class="btn-primary" data-action="night-target" data-val="${cs.me.id}" style="margin-bottom:16px;">Use Vest Tonight</button>` : ''}
            <button data-action="night-target" data-val="skip" style="border-color:var(--ink-ghost); color:var(--ink-ghost);">Skip (No Vest)</button>
        </div>`;
    }

    if (activeRole === 'GuardianAngel') {
        let wardName = cs.me.guardianTargetName || '???';
        let ward = cs.players.find(p => p.name === wardName && p.isAlive);
        return `<div class="screen screen-top">
            <h2 class="title italic" style="color:${teamColor}; font-size:42px;">Guardian Angel</h2>
            <p class="subtitle">Protect your ward: <b style="color:var(--gold);">${wardName}</b></p>
            ${ward ? `<button class="btn-primary" data-action="night-target" data-val="${ward.id}">Protect ${wardName}</button>` : `<p class="text-dim">Your ward is dead.</p><button data-action="night-target" data-val="skip">Skip</button>`}
        </div>`;
    }
    if (activeRole === 'Demon') {
        let dead = cs.players.filter(p => !p.isAlive);
        let resHTML = '';
        if (!cs.me.demonResurrectUsed) {
            resHTML = `<div style="margin-bottom:24px;"><p class="subtitle" style="text-align:left; color:var(--violet);">Resurrect a player:</p><div class="grid">${dead.length > 0 ? dead.map(p => 
                `<div class="target-card" data-action="night-target-demon" data-val='{"action":"resurrect","target":"${p.id}"}'>${p.name}</div>`
            ).join('') : '<div class="text-dim">No dead players.</div>'}</div></div>`;
        } else {
            resHTML = `<p class="text-dim" style="margin-bottom:24px;">Resurrect power used.</p>`;
        }
        
        let shuffHTML = '';
        if (!cs.me.demonShuffleUsed) {
            shuffHTML = `<div style="margin-bottom:24px; text-align:center;"><button class="btn-primary" style="background:var(--violet); border-color:var(--violet); color:white;" data-action="night-target-demon" data-val='{"action":"shuffle"}'>Shuffle All Roles</button></div>`;
        } else {
            shuffHTML = `<p class="text-dim" style="margin-bottom:24px;">Shuffle power used.</p>`;
        }
        
        return `<div class="screen screen-top">
                <h2 class="title italic" style="color:${teamColor}; font-size:42px;">Demon</h2>
                <p class="subtitle">You have two night powers. You may use one (or skip).</p>
                ${resHTML}${shuffHTML}
                <div style="text-align:center;"><button data-action="night-target" data-val="skip">Skip</button></div>
            </div>`;
    }

    if (activeRole === 'Phantom') {
        let decoyUsed = cs.me.phantomDecoyUsed;
        let mode = uiState.phantomMode;
        let modeHTML = `<div style="display:flex; gap:8px; margin-bottom:24px; justify-content:center;">
            <button class="btn-preset ${mode === 'kill' ? 'active' : ''}" data-action="phantom-mode" data-val="kill" style="border-color:var(--blood); color:var(--blood);">☠ Kill</button>
            <button class="btn-preset ${mode === 'decoy' ? 'active' : ''}" data-action="phantom-mode" data-val="decoy" ${decoyUsed ? 'disabled' : ''} style="border-color:var(--violet); color:var(--violet);">${decoyUsed ? '✗ Decoy Used' : '👻 Decoy'}</button>
        </div>`;
        let targets = alivePlayers.filter(p => p.id !== cs.me.id);
        return `<div class="screen screen-top">
            <h2 class="title italic" style="color:${teamColor}; font-size:42px;">Phantom</h2>
            <p class="subtitle">${mode === 'kill' ? 'Select a target to kill.' : 'Select a target for your decoy.'}</p>
            ${modeHTML}
            <div class="grid">${targets.map(p => `<div class="target-card" data-action="night-target-phantom" data-val="${p.id}"><div class="avatar" style="display:flex;align-items:center;justify-content:center;">${p.isBot?'<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>':p.name.charAt(0).toUpperCase()}</div><div style="font-weight:600; font-size:14px;">${p.name}</div></div>`).join('')}</div>
        </div>`;
    }

    if (activeRole === 'Arsonist') {
        let dousedCount = cs.me.dousedCount || 0;
        let targets = alivePlayers.filter(p => p.id !== cs.me.id);
        return `<div class="screen screen-top">
            <h2 class="title italic" style="color:${teamColor}; font-size:42px;">Arsonist</h2>
            <p class="subtitle">Doused targets: <b style="color:var(--blood-lit);">${dousedCount}</b></p>
            <div style="display:flex; gap:8px; margin-bottom:24px; justify-content:center;">
                <button class="btn-danger" data-action="night-target-arsonist-ignite" ${dousedCount === 0 ? 'disabled' : ''} style="max-width:200px; display:flex; align-items:center; justify-content:center; gap:8px; margin:0 auto;"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2c0 0-4 4-4 9s4 9 4 9 4-4 4-9-4-9-4-9z"></path></svg> IGNITE ALL</button>
            </div>
            <p class="subtitle" style="font-size:13px; margin-bottom:16px;">— or douse a target —</p>
            <div class="grid">${targets.map(p => `<div class="target-card" data-action="night-target-arsonist-douse" data-val="${p.id}"><div class="avatar" style="display:flex;align-items:center;justify-content:center;">${p.isBot?'<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>':p.name.charAt(0).toUpperCase()}</div><div style="font-weight:600; font-size:14px;">${p.name}</div></div>`).join('')}</div>
        </div>`;
    }

    if (activeRole === 'Gravedigger') {
        let deadPlayers = cs.players.filter(p => !p.isAlive);
        let targets = alivePlayers.filter(p => p.id !== cs.me.id);
        let killSel = uiState.gravediggerKill;
        let exhumeSel = uiState.gravediggerExhume;
        return `<div class="screen screen-top">
            <h2 class="title italic" style="color:${teamColor}; font-size:42px;">Gravedigger</h2>
            <p class="subtitle" style="font-size:13px;">Select a kill target ${killSel ? '✓' : ''} and an exhume target ${exhumeSel ? '✓' : ''}</p>
            <div style="font-size:11px; color:var(--blood-lit); text-transform:uppercase; margin-bottom:8px; font-weight:600;">Kill Target</div>
            <div class="grid">${targets.map(p => `<div class="target-card ${killSel === p.id ? 'mafia-target' : ''}" data-action="gravedigger-kill" data-val="${p.id}"><div class="avatar" style="display:flex;align-items:center;justify-content:center;">${p.isBot?'<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>':p.name.charAt(0).toUpperCase()}</div><div style="font-weight:600; font-size:13px;">${p.name}</div></div>`).join('')}</div>
            ${deadPlayers.length > 0 ? `
                <div style="font-size:11px; color:var(--violet); text-transform:uppercase; margin-bottom:8px; font-weight:600;">Exhume Target</div>
                <div class="grid">${deadPlayers.map(p => `<div class="target-card ${exhumeSel === p.id ? 'selected' : ''}" data-action="gravedigger-exhume" data-val="${p.id}" style="opacity:0.7;"><div class="avatar" style="opacity:0.5; display:flex; align-items:center; justify-content:center;"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M7 4h10l2 8-2 8H7l-2-8 2-8z"></path><line x1="12" y1="8" x2="12" y2="16"></line><line x1="9" y1="11" x2="15" y2="11"></line></svg></div><div style="font-weight:600; font-size:13px;">${p.name}</div></div>`).join('')}</div>
            ` : '<p class="text-dim" style="font-size:13px;">No graves to exhume yet.</p>'}
            ${killSel && (exhumeSel || deadPlayers.length === 0) ? `<button class="btn-danger" data-action="gravedigger-confirm">Confirm</button>` : ''}
        </div>`;
    }

    if (activeRole === 'Witch') {
        let targets = alivePlayers.filter(p => p.id !== cs.me.id);
        let puppetSel = uiState.witchPuppet;
        let victimSel = uiState.witchVictim;
        return `<div class="screen screen-top">
            <h2 class="title italic" style="color:${teamColor}; font-size:42px;">Witch</h2>
            <p class="subtitle" style="font-size:13px;">Select a Puppet ${puppetSel ? '✓' : ''} and their Victim ${victimSel ? '✓' : ''}</p>
            <div style="font-size:11px; color:var(--violet); text-transform:uppercase; margin-bottom:8px; font-weight:600;">Control Target (Puppet)</div>
            <div class="grid">${targets.map(p => `<div class="target-card ${puppetSel === p.id ? 'selected' : ''}" data-action="witch-puppet" data-val="${p.id}"><div class="avatar" style="display:flex;align-items:center;justify-content:center;">${p.isBot?'<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>':p.name.charAt(0).toUpperCase()}</div><div style="font-weight:600; font-size:13px;">${p.name}</div></div>`).join('')}</div>
            <div style="font-size:11px; color:var(--blood-lit); text-transform:uppercase; margin-bottom:8px; margin-top:16px; font-weight:600;">Force Them To Visit (Victim)</div>
            <div class="grid">${alivePlayers.map(p => `<div class="target-card ${victimSel === p.id ? 'mafia-target' : ''}" data-action="witch-victim" data-val="${p.id}"><div class="avatar" style="display:flex;align-items:center;justify-content:center;">${p.isBot?'<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>':p.name.charAt(0).toUpperCase()}</div><div style="font-weight:600; font-size:13px;">${p.name}</div></div>`).join('')}</div>
            ${puppetSel && victimSel ? `<button class="btn-primary" style="margin-top:20px;" data-action="witch-confirm">Confirm Curse</button>` : ''}
            <button data-action="night-target" data-val="skip" style="border-color:var(--ink-ghost); color:var(--ink-ghost); margin-top:12px;">Skip</button>
        </div>`;
    }

    let chargeInfo = '';
    if (activeRole === 'Trapper') {
        let charges = cs.me.trapperCharges ?? 0;
        chargeInfo = `<div style="text-align:center; margin-bottom:16px; font-size:14px; color:var(--gold);">Trap charges: <b>${charges}</b></div>`;
        if (charges <= 0) {
            return `<div class="screen screen-top"><h2 class="title italic" style="color:${teamColor}; font-size:42px;">Trapper</h2><p class="subtitle">No charges remaining.</p><button data-action="night-target" data-val="skip">Skip</button></div>`;
        }
    }

    if (activeRole === 'EvilTwin' && cs.me.enragedImmunityDay === cs.dayCount) {
        chargeInfo = `<div style="text-align:center; margin-bottom:16px; font-size:16px; color:var(--gold); font-weight:700; text-transform:uppercase;">You are Enraged!<br><span style="font-size:12px; font-weight:400; color:var(--ink-dim);">Your attack cannot be stopped.</span></div>`;
    }

    return `<div class="screen screen-top"><h2 class="title italic" style="color:${teamColor}; font-size:42px;">${rDef.name}</h2><p class="subtitle">Select your target.</p>${chargeInfo}<div class="grid">${alivePlayers.map(p => { 
        let isSel = (sel === p.id); 
        let disabled = isMafiaTeam && (cs.mafiaMates?.includes(p.name) || p.id === cs.me.id);
        if (activeRole === 'Bodyguard' && p.id === cs.me.id) disabled = true;
        if (activeRole === 'Trapper' && p.id === cs.me.id) disabled = true;
        if (cs.settings.doctorRepeatEnforced && activeRole === 'Doctor' && cs.me.lastProtected === p.id) disabled = true;
        let targetClass = isMafiaTeam && isSel ? 'mafia-target' : (isSel ? 'selected' : '');
        
        return `<div class="target-card ${targetClass} ${disabled?'dead':''}" ${!disabled ? `data-action="night-target" data-val="${p.id}"` : ''}><div class="avatar" style="display:flex;align-items:center;justify-content:center;">${p.isBot?'<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>':p.name.charAt(0).toUpperCase()}</div><div style="font-weight:600; font-size:14px;">${p.name}</div></div>`; 
    }).join('')}</div>
    <div style="margin-top:24px; text-align:center;">
        <button data-action="night-target" data-val="skip" style="border-color:var(--ink-ghost); color:var(--ink-ghost); padding:8px 16px; font-size:14px;">Skip Night Action</button>
    </div>
    </div>`; 
}

function getRoleGroupNameClient(role) {
    if (MAFIA_GROUP_ROLES.includes(role)) return 'Mafia';
    return role;
}

function getRoleBannerHTML(cs) {
    if (!cs.me || !cs.me.role || !ROLES[cs.me.role]) return '';
    let r = ROLES[cs.me.role];
    let activeRole = (cs.me.role === 'IdentityThief' && cs.me.stolenRole) ? cs.me.stolenRole : cs.me.role;
    if (cs.me.role === 'IdentityThief' && cs.me.stolenRole) r = ROLES[activeRole];
    let teamColor = TEAM_COLORS[r.team];
    return `<div class="card" style="margin-bottom:20px; padding:12px 16px; border-color:${teamColor}; text-align:left; display:flex; flex-direction:column; gap:6px; background:linear-gradient(to right, rgba(0,0,0,0.4), transparent); box-shadow:0 4px 12px rgba(0,0,0,0.5);">
        <div style="font-size:12px; color:${teamColor}; font-weight:800; letter-spacing:0.05em; text-transform:uppercase;">You are the ${r.name}</div>
        <div style="font-size:13px; color:var(--ink); opacity:0.9;"><b>Win Condition:</b> ${r.win}</div>
    </div>`;
}

/* ── DAWN ── */
function tplDawn(cs) { 
    let deaths = cs.tempState.deaths || []; 
    let phantomReturns = cs.tempState.phantomReturns || [];
    
    let returnsHTML = phantomReturns.length > 0 ? phantomReturns.map(n => 
        `<div class="card" style="border-color:var(--sage); margin-bottom:16px; padding:24px;">
            <div style="font-size:24px; font-family:'Cormorant Garamond'; color:var(--sage); font-weight:600;">${n}</div>
            <div class="text-dim" style="font-size:14px; margin-top:8px; font-style:italic;">has returned from the dead!</div>
        </div>`
    ).join('') : '';

    let deathsHTML = deaths.length === 0 
        ? `<div class="card" style="border-color:var(--sage); padding:40px; margin:40px 0;"><h2 class="title-huge italic" style="color:var(--sage); margin:0;">No one died.</h2></div>` 
        : `<div class="list" style="margin-top:32px;">${deaths.map(d => {
            let causeText = d.cleaned ? 'Their identity was erased.' : (d.cause || 'Their true role remains a mystery.');
            if (d.fakeDeceased) causeText = 'Their true role remains a mystery.';
            return `<div class="card" style="border-color:var(--blood); margin-bottom:16px; padding:32px;">
                <div style="font-size:32px; font-family:'Cormorant Garamond'; color:var(--blood-lit); font-weight:600;">${d.name}</div>
                <div style="height:1px; background:var(--border); margin:16px auto; width:50%;"></div>
                <div class="text-dim" style="font-size:16px; font-style:italic;">${causeText}</div>
            </div>`;
        }).join('')}</div>`; 

    let markHTML = (cs.me && cs.me.role === 'Prophet' && cs.tempState.prophetAscensionMessage) ? `<div class="card" style="border-color:var(--violet); margin-top:16px; padding:20px;">
        <div style="color:var(--violet); font-size:14px; font-weight:600;">✨ Ascended</div>
        <div style="font-size:18px; margin-top:8px; color:var(--ink);" class="italic">Your prophecy was correct. You are now immune to night attacks.</div>
    </div>` : '';

    let shuffleHTML = (cs.me && cs.me.demonShuffled) ? `
    <div class="card" style="border-color:var(--violet); margin-bottom:16px; padding:24px;">
        <div style="font-size:24px; font-family:'Cormorant Garamond'; color:var(--violet); font-weight:600;">The Great Shuffle</div>
        <div style="font-size:18px; margin-top:8px; color:var(--ink);" class="italic">The Demon has twisted fate. Your role has been changed. Check your role icon.</div>
    </div>` : '';

    let resultHTML = '';
    if (cs.me) {
        let role = cs.me.role;
        if (role === 'Detective' && cs.me.detResult) resultHTML += dawnResult('🕵️ Investigation', cs.me.detResult, 'var(--violet)');
        if (role === 'DrunkDetective' && cs.me.drunkDetResult) resultHTML += dawnResult('🍺 Investigation', cs.me.drunkDetResult, 'var(--violet)');
        if (role === 'Consigliere' && cs.me.consigliereResult) resultHTML += dawnResult('🔍 Intel', cs.me.consigliereResult, 'var(--blood-lit)');
        if (role === 'Blackmailer' && cs.me.blackmailerResult) resultHTML += dawnResult('📋 Intercepted', cs.me.blackmailerResult, 'var(--blood-lit)');
        if (role === 'Spy' && cs.me.spyResult) resultHTML += dawnResult('🕵️ Spy Report', cs.me.spyResult, 'var(--gold)');
        if (role === 'Watcher' && cs.me.watcherResult) resultHTML += dawnResult('👁 Watch Report', cs.me.watcherResult, 'var(--gold)');
        if (role === 'IdentityThief' && cs.me.IdentityThiefResult) resultHTML += dawnResult('🧹 Cleaned', cs.me.IdentityThiefResult, 'var(--blood-lit)');
        if (role === 'Stalker' && cs.me.stalkerResult) resultHTML += dawnResult('🕶 Shadow Report', cs.me.stalkerResult, 'var(--neutral)');
        if (role === 'Gravedigger' && cs.me.gravediggerResult) resultHTML += dawnResult('<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:6px;vertical-align:middle;"><path d="M7 4h10l2 8-2 8H7l-2-8 2-8z"></path></svg> Exhumed', cs.me.gravediggerResult, 'var(--neutral)');
        if (role === 'Witch' && cs.me.witchPuppetRoleName) resultHTML += dawnResult('<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:6px;vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg> Dark Whispers', `Your puppet's true role is the <b>${cs.me.witchPuppetRoleName}</b>.`, 'var(--violet)');
        if (cs.me.plagueWarning) resultHTML += dawnResult('<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:6px;vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><path d="M12 7v5l3 3"></path></svg> Plague Warning', 'You feel a sickness taking hold... you will die tomorrow night unless the Doctor saves you.', 'var(--sage)');
        if (cs.me.escortDiedToSK) resultHTML += dawnResult('☠ Block Failed', 'You tried to block a Serial Killer... and paid with your life.', 'var(--blood)');
        if (cs.me.escortDiedToParanoid) resultHTML += dawnResult('☠ Block Failed', 'You blocked a Paranoid Doctor, who panicked and killed you.', 'var(--blood)');
        if (cs.me.doctorDiedToSK) resultHTML += dawnResult('☠ Heal Failed', 'You tried to heal a Serial Killer... and paid with your life.', 'var(--blood)');
        if (cs.me.detectiveDiedToSK) resultHTML += dawnResult('☠ Investigation Failed', 'You investigated a Serial Killer... they caught you snooping.', 'var(--blood)');
    }

    return `<div class="screen screen-top"><h1 class="title">Dawn of Day ${cs.dayCount}</h1><p class="subtitle">The town wakes to find...</p>${returnsHTML}${deathsHTML}${markHTML}${shuffleHTML}${resultHTML}${!net.isHost ? `<div class="spacer"></div><div class="text-center text-dim" style="padding:20px;">Waiting for host to continue...</div>` : ''}</div>`; 
}

function dawnResult(label, text, color) {
    return `<div class="card" style="border-color:${color}; margin-top:16px; padding:20px;">
        <div style="color:${color}; font-size:14px; font-weight:600;">${label}</div>
        <div style="font-size:16px; margin-top:8px;" class="italic">${text}</div>
    </div>`;
}

/* ── DAY ── */
function tplDay(cs) { 
    let intelHTML = '';
    if (cs.me) {
        if (cs.me.role === 'Detective' && cs.me.detResult) intelHTML = `<div style="color:var(--violet); font-size:14px; text-align:center; margin-bottom:24px; font-weight:600;">🕵️ ${cs.me.detResult}</div>`;
        if (cs.me.role === 'DrunkDetective' && cs.me.drunkDetResult) intelHTML = `<div style="color:var(--violet); font-size:14px; text-align:center; margin-bottom:24px; font-weight:600;">🍺 ${cs.me.drunkDetResult}</div>`;
    }

    let statusMsg = (!cs.me || !cs.me.isAlive) ? `<div style="color:var(--ink-ghost); text-align:center; margin-bottom:24px; font-style:italic;">You are dead. Observe the living.</div>` : '';

    let mayorBtn = '';
    if (cs.me && cs.me.role === 'Mayor' && cs.me.isAlive) {
        if (cs.me.mayorRevealed) {
            mayorBtn = `<div style="text-align:center; margin-bottom:20px; padding:12px; background:rgba(201,167,20,0.1); border:1px solid var(--gold); border-radius:8px; color:var(--gold); font-weight:600; font-size:13px; display:flex; align-items:center; justify-content:center; gap:8px;"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="2 20 22 20 18 10 12 15 6 10 2 20"></polygon></svg> You have revealed. Your vote counts as 3.</div>`;
        } else {
            mayorBtn = `<div style="text-align:center; margin-bottom:20px;"><button class="btn-primary" data-action="mayor-reveal" style="max-width:250px; margin:0 auto; padding:12px; display:flex; align-items:center; justify-content:center; gap:8px;"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="2 20 22 20 18 10 12 15 6 10 2 20"></polygon></svg> Reveal as Mayor</button></div>`;
        }
    }

    let demonBtn = '';
    if (cs.me && cs.me.role === 'Demon' && cs.me.isAlive && !cs.me.demonVoteUsed) {
        let aliveOthers = cs.players.filter(p => p.isAlive && p.id !== cs.me.id);
        demonBtn = `<div style="text-align:center; margin-bottom:20px; padding:12px; border:1px solid var(--violet); border-radius:8px;">
            <p style="color:var(--violet); font-size:14px; margin-bottom:8px;"><b>Demonic Silence</b> (One-time): Prevent a player from voting today.</p>
            <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
                ${aliveOthers.map(p => `<button class="btn-primary" style="background:transparent; color:var(--violet); border-color:var(--violet); padding:6px 12px; font-size:12px;" data-action="demon-silence" data-val="${p.id}">${p.name}</button>`).join('')}
            </div>
        </div>`;
    }

    let mayorBanner = '';
    if (cs.mayorReveals && cs.mayorReveals.length > 0) {
        mayorBanner = `<div style="text-align:center; margin-bottom:20px; padding:10px; background:rgba(201,167,20,0.08); border:1px solid rgba(201,167,20,0.3); border-radius:8px; color:var(--gold); font-size:13px; display:flex; align-items:center; justify-content:center; gap:8px;"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polygon points="2 20 22 20 18 10 12 15 6 10 2 20"></polygon></svg> Revealed Mayor${cs.mayorReveals.length > 1 ? 's' : ''}: <b>${cs.mayorReveals.join(', ')}</b></div>`;
    }

    let cursedBanner = (cs.me && cs.me.cursedActivated) ? `<div style="text-align:center; margin-bottom:20px; padding:12px; background:rgba(163,29,29,0.1); border:1px solid var(--blood); border-radius:8px; color:var(--blood-lit); font-weight:600; font-size:13px;">🌑 The Curse has awakened... You are now Mafia!</div>` : '';

    let stalkerUI = '';
    if (cs.me && cs.me.role === 'Stalker' && cs.me.isAlive && !cs.me.stalkerUsed) {
        let aliveOthers = cs.players.filter(p => p.isAlive && p.id !== cs.me.id);
        stalkerUI = `<div class="card" style="border-color:var(--blood); margin-bottom:20px; padding:16px; text-align:left;">
            <div style="font-size:12px; color:var(--blood); font-weight:600; text-transform:uppercase; margin-bottom:12px;">👁️ Publicly Expose (One Use)</div>
            <select id="stalker-target" onchange="uiState.stalkerTarget = this.value" style="width:100%; padding:8px; background:var(--bg-dark); color:var(--ink); border:1px solid var(--border); border-radius:6px; margin-bottom:12px; font-family:Inter; font-size:13px;">
                <option value="">Select player to expose...</option>
                ${aliveOthers.map(p => `<option value="${p.id}" ${uiState.stalkerTarget === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
            <button data-action="stalker-expose" style="padding:10px; font-size:12px; border-color:var(--blood); color:var(--blood);">Expose Role</button>
        </div>`;
    }

    let amnesiacUI = '';
    if (cs.me && cs.me.role === 'Amnesiac' && cs.me.isAlive && !cs.me.amnesiacUsed) {
        let deadPlayers = cs.players.filter(p => !p.isAlive && p.id !== cs.me.id);
        if (deadPlayers.length > 0) {
            amnesiacUI = `<div class="card" style="border-color:var(--neutral); margin-bottom:20px; padding:16px; text-align:left;">
                <div style="font-size:12px; color:var(--neutral); font-weight:600; text-transform:uppercase; margin-bottom:12px;">🎭 Remember Role (One Use)</div>
                <select id="amnesiac-target" onchange="uiState.amnesiacTarget = this.value" style="width:100%; padding:8px; background:var(--bg-dark); color:var(--ink); border:1px solid var(--border); border-radius:6px; margin-bottom:12px; font-family:Inter; font-size:13px;">
                    <option value="">Select a grave...</option>
                    ${deadPlayers.map(p => `<option value="${p.id}" ${uiState.amnesiacTarget === p.id ? 'selected' : ''}>${p.name} (??)</option>`).join('')}
                </select>
                <button data-action="amnesiac-remember" style="padding:10px; font-size:12px; border-color:var(--neutral); color:var(--neutral);">Inherit Role</button>
            </div>`;
        }
    }

    let journalistUI = '';
    if (cs.me && cs.me.role === 'Journalist' && cs.me.isAlive && !cs.me.journalistUsed) {
        let aliveOthers = cs.players.filter(p => p.isAlive && p.id !== cs.me.id);
        let roleOptions = Object.keys(ROLES).filter(r => !ROLES[r]._internal).map(r => `<option value="${r}">${ROLES[r].name}</option>`).join('');
        journalistUI = `<div class="card" style="border-color:var(--gold); margin-bottom:20px; padding:16px; text-align:left;">
            <div style="font-size:12px; color:var(--gold); font-weight:600; text-transform:uppercase; margin-bottom:12px;">📰 Public Accusation (One Use)</div>
            <select id="journalist-target" onchange="uiState.journalistTarget = this.value" style="width:100%; padding:8px; background:var(--bg-dark); color:var(--ink); border:1px solid var(--border); border-radius:6px; margin-bottom:8px; font-family:Inter; font-size:13px;">
                <option value="">Select target...</option>
                ${aliveOthers.map(p => `<option value="${p.id}" ${uiState.journalistTarget === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
            <select id="journalist-guess" onchange="uiState.journalistGuess = this.value" style="width:100%; padding:8px; background:var(--bg-dark); color:var(--ink); border:1px solid var(--border); border-radius:6px; margin-bottom:12px; font-family:Inter; font-size:13px;">
                <option value="">Accuse them of being...</option>
                ${Object.keys(ROLES).filter(r => !ROLES[r]._internal).map(r => `<option value="${r}" ${uiState.journalistGuess === r ? 'selected' : ''}>${ROLES[r].name}</option>`).join('')}
            </select>
            <button data-action="journalist-accuse" style="padding:10px; font-size:12px; border-color:var(--gold); color:var(--gold);">Publish Accusation</button>
        </div>`;
    }

    let herbalistUI = '';
    if (cs.me && cs.me.role === 'Herbalist' && cs.me.isAlive && !cs.me.herbalistUsed && cs.me.herbalistPotion) {
        let aliveOthers = cs.players.filter(p => p.isAlive && p.id !== cs.me.id);
        let potionColors = { 'Heal': 'var(--sage)', 'Reveal': 'var(--gold)', 'Poison': 'var(--blood-lit)' };
        let potionColor = potionColors[cs.me.herbalistPotion];
        let potionDesc = {
            'Heal': 'Protect target for the next night.',
            'Reveal': 'Instantly learn target\'s role.',
            'Poison': 'Target dies at dusk.'
        }[cs.me.herbalistPotion];
        
        herbalistUI = `<div class="card" style="border-color:${potionColor}; margin-bottom:20px; padding:16px; text-align:left;">
            <div style="font-size:12px; color:${potionColor}; font-weight:600; text-transform:uppercase; margin-bottom:4px;">🧪 Potion: ${cs.me.herbalistPotion} (One Use)</div>
            <div style="font-size:11px; color:var(--ink-dim); margin-bottom:12px; font-style:italic;">${potionDesc}</div>
            <select id="herbalist-target" onchange="uiState.herbalistTarget = this.value" style="width:100%; padding:8px; background:var(--bg-dark); color:var(--ink); border:1px solid var(--border); border-radius:6px; margin-bottom:12px; font-family:Inter; font-size:13px;">
                <option value="">Select target...</option>
                ${aliveOthers.map(p => `<option value="${p.id}" ${uiState.herbalistTarget === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
            <button data-action="herbalist-use" style="padding:10px; font-size:12px; border-color:${potionColor}; color:${potionColor};">Use Potion</button>
        </div>`;
    }

    let herbalistRevealHTML = (cs.me && cs.me.herbalistRevealResult) ? `<div style="text-align:center; margin-bottom:20px; padding:12px; background:rgba(201,167,20,0.1); border:1px solid var(--gold); border-radius:8px; color:var(--gold); font-weight:600; font-size:13px;">🧪 ${cs.me.herbalistRevealResult}</div>` : '';

    let dayEventsHTML = '';
    if (cs.tempState.dayEvents && cs.tempState.dayEvents.length > 0) {
        dayEventsHTML = `<div style="margin-bottom:24px; display:flex; flex-direction:column; gap:8px;">
            ${cs.tempState.dayEvents.map(evt => `<div class="card" style="padding:12px; border-color:var(--blood-lit); text-align:center; background:rgba(163,29,29,0.05);">
                <span style="font-size:14px; color:var(--blood-lit); font-weight:600;">${evt}</span>
            </div>`).join('')}
        </div>`;
    }

    let skipVoteBtn = '';
    if (cs.me && cs.me.isAlive) {
        let aliveCount = cs.players.filter(p => p.isAlive).length;
        let skipCount = Object.keys(cs.skipVotes || {}).length;
        let iSkipped = cs.skipVotes && cs.skipVotes[cs.me.id];
        skipVoteBtn = `<div style="text-align:center;">
            <button class="skip-btn ${iSkipped ? 'voted' : ''}" data-action="skip-vote" ${iSkipped ? 'disabled' : ''}>
                ${iSkipped ? '✓ Skip Voted' : '⏭ Skip Vote'} (${skipCount}/${Math.floor(aliveCount / 2) + 1})
            </button>
        </div>`;
    }
    
    let banner = getRoleBannerHTML(cs);
    return `<div class="screen screen-top">${banner}<h1 class="title">Day ${cs.dayCount}</h1><p class="subtitle">Discuss the night's events.</p>${dayEventsHTML}${intelHTML}${statusMsg}${cursedBanner}${mayorBanner}${mayorBtn}${demonBtn}${herbalistRevealHTML}${stalkerUI}${amnesiacUI}${journalistUI}${herbalistUI}<div class="grid">${cs.players.map(p => `<div class="card ${p.isAlive ? '' : 'dead'}" style="padding:16px 12px;"><div style="font-weight:600; font-size:13px; color:${p.isAlive ? 'var(--ink)' : 'var(--ink-ghost)'}; display:flex; align-items:center; justify-content:center; gap:4px;">${p.isBot?'<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>':''}${p.name}${p.mayorRevealed ? '<svg viewBox="0 0 24 24" width="14" height="14" stroke="var(--gold)" stroke-width="2" fill="none"><polygon points="2 20 22 20 18 10 12 15 6 10 2 20"></polygon></svg>' : ''}</div>${!p.isAlive ? `<div style="font-size:11px; color:var(--blood); margin-top:6px; font-family:'Cormorant Garamond'; font-style:italic;">Deceased</div>` : ''}${p.publiclyRevealedRole ? `<div style="font-size:11px; color:var(--gold); margin-top:6px; font-weight:700; text-transform:uppercase;">${ROLES[p.roleReveal]?.name || p.roleReveal}</div>` : ''}</div>`).join('')}</div>${skipVoteBtn}${!net.isHost ? `<div class="spacer"></div><div class="text-center text-dim" style="padding:20px;">Discussing... waiting for host to open voting.</div>` : ''}</div>`; 
}

/* ── VOTE ── */
function tplVote(cs) { 
    let alive = cs.players.filter(p => p.isAlive); 
    let tallies = {}; 
    cs.players.forEach(p => { 
        if(p.voteTarget && p.isAlive) {
            let weight = p.mayorRevealed ? 3 : 1;
            tallies[p.voteTarget] = (tallies[p.voteTarget]||0) + weight;
        }
    }); 

    let isSilenced = cs.me && (cs.me.blackmailed || cs.me.sabotaged || cs.me.demonSilenced);
    
    let titleBlock;
    if (isSilenced) {
        titleBlock = `<h1 class="title italic" style="color:var(--ink-ghost);">Silenced</h1><p class="subtitle" style="color:var(--blood-lit);">You have been silenced — you cannot vote.</p>`;
    } else if (cs.me && cs.me.isAlive) {
        titleBlock = `<h1 class="title italic" style="color:var(--blood-lit);">Cast Votes</h1><p class="subtitle">Tap a player to vote for them.</p>`;
    } else {
        titleBlock = `<h1 class="title italic" style="color:var(--ink-ghost);">Voting</h1><p class="subtitle" style="font-style:italic; color:var(--ink-ghost);">You are dead. Watch the vote unfold.</p>`;
    }

    let banner = getRoleBannerHTML(cs);
    return `<div class="screen screen-top">${banner}${titleBlock}<div class="list">${alive.map(p => { 
        let myVote = cs.me && cs.me.voteTarget === p.id; 
        let count = tallies[p.id] || 0; 
        
        let isImmune = p.enragedImmunityDay === cs.dayCount;
        let canVote = cs.me && cs.me.isAlive && !isSilenced && !isImmune;
        let interactivity = canVote ? `cursor:pointer;` : `pointer-events:none; opacity:0.8;`;
        let clickAction = canVote ? `data-action="vote-target" data-val="${p.id}"` : '';

        return `<div class="list-item" style="${interactivity} padding:20px; ${myVote?'border-color:var(--blood-lit); background:rgba(163,29,29,0.05);':''}" ${clickAction}><span style="font-size:16px; display:flex; align-items:center; gap:6px; ${myVote?'color:var(--blood-lit); font-weight:600;':''}">${p.isBot?'<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>':''}${p.name}${p.mayorRevealed ? '<svg viewBox="0 0 24 24" width="14" height="14" stroke="var(--gold)" stroke-width="2" fill="none"><polygon points="2 20 22 20 18 10 12 15 6 10 2 20"></polygon></svg>' : ''}${p.publiclyRevealedRole ? ` <span style="color:var(--gold); font-size:11px; font-weight:700; text-transform:uppercase;">(${ROLES[p.roleReveal]?.name || p.roleReveal})</span>` : ''}${isImmune ? ' <span style="color:var(--gold); font-size:12px; font-weight:700;">(IMMUNE)</span>' : ''}</span><div style="display:flex; gap:6px;">${Array(Math.min(count, 20)).fill('<div style="width:8px;height:8px;background:var(--blood-lit);border-radius:50%; box-shadow:0 0 6px rgba(231,76,60,0.5);"></div>').join('')}${count > 0 ? `<span style="font-size:11px; color:var(--blood-lit); margin-left:4px; font-weight:700;">${count}</span>` : ''}</div></div>`; 
    }).join('')}</div></div>`; 
}

/* ── ELIMINATION ── */
function tplElim(cs) { 
    let p = cs.tempState.eliminated; 
    let elimHTML = !p 
        ? `<div class="card" style="padding:48px 24px; margin-top:40px;"><h2 class="title-huge italic" style="color:var(--ink-dim); margin:0;">A Tie.</h2><div style="margin:24px 0; height:1px; background:var(--border);"></div><p class="text-dim" style="font-size:16px;">The town could not reach a decision.</p></div>` 
        : `<div class="card" style="padding:48px 24px; margin-top:40px; border-color:var(--blood);"><h2 class="title-huge italic" style="color:var(--blood-lit); margin-bottom:8px;">${p.name}</h2><p class="text-dim" style="font-size:16px;">has been eliminated by the town.</p><div style="margin:32px 0; height:1px; background:linear-gradient(90deg, transparent, var(--border), transparent);"></div><div class="text-dim" style="font-size:16px; font-style:italic;">Their true role remains a mystery.</div></div>`; 
    
    // Herbalist dusk kill
    let poisonKill = cs.tempState.herbalistPoisonKill;
    let poisonHTML = poisonKill ? `<div class="card" style="padding:32px 24px; margin-top:20px; border-color:var(--blood);"><h2 style="font-family:'Cormorant Garamond'; font-size:28px; color:var(--blood-lit); font-weight:600; margin-bottom:8px;">${poisonKill.name}</h2><p class="text-dim" style="font-size:14px; font-style:italic;">succumbed to the Herbalist's poison at dusk.</p></div>` : '';

    let enragedHTML = cs.tempState.enragedTwin ? `<div class="card" style="padding:32px 24px; margin-top:20px; border-color:var(--gold);"><h2 style="font-family:'Cormorant Garamond'; font-size:24px; color:var(--gold); font-weight:600; margin-bottom:8px;">The Innocent Twin has fallen!</h2><p class="text-dim" style="font-size:14px; font-style:italic;">The Evil Twin has become Enraged! They are now invincible at night and their attack cannot be stopped!</p></div>` : '';

    return `<div class="screen screen-top">${elimHTML}${poisonHTML}${enragedHTML}${!net.isHost ? `<div class="spacer"></div><div class="text-center text-dim" style="padding:20px;">Waiting for host...</div>` : ''}</div>`; 
}

/* ── GAME OVER ── */
function tplGameOver(cs) { 
    let w = cs.tempState.winner; 
    if (!w) return `<div class="screen"><p class="text-dim">Game Over</p></div>`;
    
    // Side wins
    let sideWins = '';
    if (cs.tempState.survivorWin) sideWins += `<div style="margin-top:16px; padding:10px; background:rgba(140,140,140,0.1); border:1px solid rgba(140,140,140,0.3); border-radius:8px; color:var(--neutral); font-size:13px; text-align:center;">🛡 <b>Survivor Win:</b> ${cs.tempState.survivorWin.join(', ')}</div>`;
    if (cs.tempState.angelWin) sideWins += `<div style="margin-top:8px; padding:10px; background:rgba(201,167,20,0.1); border:1px solid rgba(201,167,20,0.3); border-radius:8px; color:var(--gold); font-size:13px; text-align:center;">😇 <b>Guardian Angel Win:</b> ${cs.tempState.angelWin.join(', ')}</div>`;
    if (cs.tempState.prophetWin) sideWins += `<div style="margin-top:8px; padding:10px; background:rgba(163,29,29,0.1); border:1px solid var(--violet); border-radius:8px; color:var(--violet); font-size:13px; text-align:center;">🔮 <b>Prophet Ascension:</b> ${cs.tempState.prophetWin.join(', ')}</div>`;
    if (cs.tempState.saboteurWin) sideWins += `<div style="margin-top:8px; padding:10px; background:rgba(140,140,140,0.1); border:1px solid rgba(140,140,140,0.3); border-radius:8px; color:var(--neutral); font-size:13px; text-align:center;">🔧 <b>Saboteur Win:</b> ${cs.tempState.saboteurWin.join(', ')}</div>`;

    return `<div class="screen screen-top"><div class="card" style="border-color:${TEAM_COLORS[w.team]}; padding:48px 24px; margin-top:20px;"><div class="team-badge" style="border-color:${TEAM_COLORS[w.team]}; color:${TEAM_COLORS[w.team]}; margin-bottom:16px;">Game Over</div><h2 class="title-huge italic" style="color:${TEAM_COLORS[w.team]}; text-shadow:0 0 20px ${TEAM_COLORS[w.team]}40;">${w.title}</h2>${sideWins}</div><div class="list" style="margin-top:40px;">${cs.players.map(p => {
        let role = p.roleReveal || p.role;
        let roleColor = ROLES[role] ? TEAM_COLORS[ROLES[role].team] : 'var(--ink-dim)';
        return `<div class="list-item" style="padding:16px 20px; ${p.isAlive?'':'opacity:0.5; filter:grayscale(100%);'}"><span style="font-weight:600; display:flex; align-items:center; gap:6px;">${p.isBot?'<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>':''}${p.name}</span><span style="font-family:'Cormorant Garamond'; font-style:italic; font-size:18px; font-weight:600; color:${roleColor}">${ROLES[role]?.name || role}</span></div>`;
    }).join('')}</div>${!net.isHost ? `<div class="spacer"></div><div class="text-center text-dim" style="padding:20px;">Waiting for host to restart...</div>` : ''}</div>`; 
}

/* ── HOST CONTROLS ── */
function renderHostControls(phase) { 
    let btns = ''; 
    if (phase === 'DAWN') btns = `<button class="btn-primary" data-action="host-next-day">Begin Discussion</button>`; 
    if (phase === 'DAY') btns = `<button class="btn-primary" data-action="host-start-vote">Start Voting</button>`; 
    if (phase === 'VOTE') btns = `<button class="btn-danger" data-action="host-finish-vote">Lock Votes</button>`; 
    if (phase === 'ELIMINATION') btns = `<button class="btn-primary" data-action="host-next-night" style="border-color:var(--violet); color:var(--violet);">Dusk Falls</button>`; 
    if (phase === 'GAME_OVER') btns = `<button class="btn-primary" data-action="host-restart">Play Again</button>`; 
    return `<div class="fixed-host-controls"><div style="font-size:11px; font-weight:600; letter-spacing:0.1em; color:var(--ink-ghost); text-transform:uppercase; margin-bottom:12px; text-align:center;">Host Controls</div>${btns}</div>`; 
}

/* ==========================================================================
   EVENT HANDLERS 
   ========================================================================== */
document.body.addEventListener('input', (e) => {
    if (e.target.id === 'rulebook-search') {
        rulebookSearch = e.target.value;
        renderRulebook();
    }
});

document.body.addEventListener('click', (e) => {
    let btn = e.target.closest('[data-action]');
    if (!btn) return;
    let action = btn.getAttribute('data-action');
    let val = btn.getAttribute('data-val');

    if (action === 'toggle-rulebook') {
        clientState.showRulebook = !clientState.showRulebook;
        renderRulebook();
    }
    else if (action === 'host-setup') { let name = document.getElementById('player-name').value.trim(); if(name) window.initHost(name); }
    else if (action === 'join-setup') { let name = document.getElementById('player-name').value.trim(); let code = document.getElementById('room-code').value.trim(); if(name && code) window.initClient(name, code); }
    else if (action === 'ready') sendAction('READY');
    else if (action === 'night-target') sendAction('NIGHT_ACTION', { target: val });
    else if (action === 'vote-target') sendAction('VOTE', { target: val });
    else if (action === 'kick-player') sendAction('KICK', { targetId: val }); 
    else if (action === 'host-start') window.startGame();
    
    else if (action === 'add-bot') {
        let availableNames = BOT_NAMES.filter(n => !hostState.players.some(p => p.name === n));
        let bName = availableNames.length > 0 
            ? availableNames[Math.floor(Math.random() * availableNames.length)] 
            : BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + ' ' + Math.floor(Math.random() * 100);
        hostState.players.push({ id: generateId(), name: bName, ready: false, isAlive: true, isBot: true });
        syncClients();
    }
    
    // ── MODE TOGGLE ──
    else if (action === 'set-role-mode') {
        hostState.roleMode = val;
        syncClients();
    }

    // ── CLASSIC MODE ACTIONS ──
    else if (action === 'set-preset-classic') { hostState.activeRoles = [...PRESETS[val]]; syncClients(); }
    else if (action === 'toggle-role') {
        if (hostState.activeRoles.includes(val)) hostState.activeRoles = hostState.activeRoles.filter(r => r !== val);
        else hostState.activeRoles.push(val);
        syncClients();
    }
    else if (action === 'adj-mafia') {
        let amt = parseInt(val);
        if (hostState.settings.mafiaCount === -1 && amt > 0) hostState.settings.mafiaCount = 1;
        else if (hostState.settings.mafiaCount === 1 && amt < 0) hostState.settings.mafiaCount = -1;
        else if (hostState.settings.mafiaCount > 0) hostState.settings.mafiaCount += amt;
        syncClients();
    }
    
    // ── POOL MODE ACTIONS ──
    else if (action === 'pool-add') {
        let isFixed = (val === 'Villager' || val === 'Mafia');
        if (hostState.settings.poolBuilderCaps && !isFixed && countInPool(val) >= 3) return; // Hard cap
        hostState.rolePool.push(val);
        syncClients();
    }
    else if (action === 'pool-remove') {
        let isFixed = (val === 'Villager' || val === 'Mafia');
        let count = countInPool(val);
        if (isFixed && count <= 1) return;
        let idx = hostState.rolePool.lastIndexOf(val);
        if (idx >= 0) { hostState.rolePool.splice(idx, 1); syncClients(); }
    }
    else if (action === 'pool-pill-remove') {
        let idx = parseInt(val);
        if (idx >= 0 && idx < hostState.rolePool.length) {
            let role = hostState.rolePool[idx];
            let isFixed = (role === 'Villager' || role === 'Mafia');
            if (isFixed && countInPool(role) <= 1) return;
            hostState.rolePool.splice(idx, 1);
            syncClients();
        }
    }
    else if (action === 'set-preset-pool') {
        let template = [...PRESETS[val]];
        let n = hostState.players.length;
        // Scale template to player count
        if (template.length < n) {
            while (template.length < n) template.push('Villager');
        } else if (template.length > n) {
            let removeCount = template.length - n;
            let trimTier = (predicate) => {
                for (let i = template.length - 1; i >= 0 && removeCount > 0; i--) {
                    if (predicate(template[i])) {
                        template.splice(i, 1);
                        removeCount--;
                    }
                }
            };
            
            for (let i = template.length - 1; i >= 0 && removeCount > 0; i--) {
                if (template[i] === 'Villager' && template.filter(r => r === 'Villager').length > 1) {
                    template.splice(i, 1);
                    removeCount--;
                }
            }
            if (removeCount > 0) trimTier(r => NEUTRAL_PASSIVE.includes(r));
            if (removeCount > 0) trimTier(r => TOWN_ROLES.includes(r) && r !== 'Villager');
            
            for (let i = template.length - 1; i >= 0 && removeCount > 0; i--) {
                if (ALL_MAFIA_MEMBERS.includes(template[i]) && template.filter(r => ALL_MAFIA_MEMBERS.includes(r)).length > 1) {
                    template.splice(i, 1);
                    removeCount--;
                }
            }
            if (removeCount > 0) trimTier(r => NEUTRAL_KILLERS.includes(r));
            if (removeCount > 0) trimTier(r => ALL_MAFIA_MEMBERS.includes(r));
            while (template.length > n) template.pop();
        }
        hostState.rolePool = template;
        syncClients();
    }

    // ── SHARED SETTINGS ──
    else if (action === 'toggle-setting') {
        hostState.settings[val] = !hostState.settings[val];
        syncClients();
    }
    else if (action === 'adj-time') {
        let parts = val.split('|');
        let amt = parseInt(parts[1]);
        if (parts[0] === 'discuss') hostState.settings.discussTime = Math.max(15, hostState.settings.discussTime + amt);
        if (parts[0] === 'vote') hostState.settings.voteTime = Math.max(15, hostState.settings.voteTime + amt);
        syncClients();
    }

    // ── MAYOR REVEAL ──
    else if (action === 'mayor-reveal') { sendAction('MAYOR_REVEAL'); }
    
    // ── DEMON SILENCE ──
    else if (action === 'demon-silence') { sendAction('DEMON_SILENCE', { target: val }); }
    
    // ── SKIP VOTE ──
    else if (action === 'skip-vote') { sendAction('SKIP_VOTE'); }

    // ── DAY ACTIONS ──
    else if (action === 'stalker-expose') {
        let targetEl = document.getElementById('stalker-target');
        if (targetEl && targetEl.value) {
            sendAction('STALKER_EXPOSE', { targetId: targetEl.value });
            uiState.stalkerTarget = null;
        }
    }
    else if (action === 'amnesiac-remember') {
        let targetEl = document.getElementById('amnesiac-target');
        if (targetEl && targetEl.value) {
            sendAction('AMNESIAC_REMEMBER', { targetId: targetEl.value });
            uiState.amnesiacTarget = null;
        }
    }
    else if (action === 'journalist-accuse') {
        let targetEl = document.getElementById('journalist-target');
        let guessEl = document.getElementById('journalist-guess');
        if (targetEl && guessEl && targetEl.value && guessEl.value) {
            sendAction('JOURNALIST_ACCUSE', { targetId: targetEl.value, guessedRole: guessEl.value });
            uiState.journalistTarget = null;
            uiState.journalistGuess = '';
        }
    }
    else if (action === 'herbalist-use') {
        let targetEl = document.getElementById('herbalist-target');
        if (targetEl && targetEl.value) {
            sendAction('HERBALIST_USE', { targetId: targetEl.value });
            uiState.herbalistTarget = null;
        }
    }

    // ── PHANTOM MODE ──
    else if (action === 'phantom-mode') { uiState.phantomMode = val; render(); }
    else if (action === 'night-target-demon') {
        sendAction('NIGHT_ACTION', { target: val });
    }
    else if (action === 'night-target-phantom') {
        let mode = uiState.phantomMode || 'kill';
        sendAction('NIGHT_ACTION', { target: JSON.stringify({ action: mode, target: val }) });
    }

    // ── ARSONIST ──
    else if (action === 'night-target-arsonist-douse') {
        sendAction('NIGHT_ACTION', { target: JSON.stringify({ action: 'douse', target: val }) });
    }
    else if (action === 'night-target-arsonist-ignite') {
        sendAction('NIGHT_ACTION', { target: JSON.stringify({ action: 'ignite' }) });
    }

    // ── GRAVEDIGGER ──
    else if (action === 'gravedigger-kill') { uiState.gravediggerKill = val; render(); }
    else if (action === 'gravedigger-exhume') { uiState.gravediggerExhume = val; render(); }
    else if (action === 'gravedigger-confirm') {
        let payload = { kill: uiState.gravediggerKill, exhume: uiState.gravediggerExhume || null };
        sendAction('NIGHT_ACTION', { target: JSON.stringify(payload) });
        uiState.gravediggerKill = null;
        uiState.gravediggerExhume = null;
    }
    
    // ── WITCH ──
    else if (action === 'witch-puppet') { uiState.witchPuppet = val; render(); }
    else if (action === 'witch-victim') { uiState.witchVictim = val; render(); }
    else if (action === 'witch-confirm') {
        let payload = { puppetId: uiState.witchPuppet, victimId: uiState.witchVictim };
        sendAction('NIGHT_ACTION', { target: JSON.stringify(payload) });
        uiState.witchPuppet = null;
        uiState.witchVictim = null;
    }
    
    // ── HOST PHASE CONTROLS ──
    else if (action === 'host-next-day') { 
        let win = checkWin();
        if (win) { triggerGameOver(win); } 
        else { 
            hostState.phase = 'DAY'; 
            hostState.timerEndsAt = Date.now() + (hostState.settings.discussTime * 1000);
            hostState.autoAdvanced = false;
            hostState.skipVotes = {};
            syncClients();
        }
    }
    else if (action === 'host-start-vote') { 
        hostState.phase = 'VOTE'; hostState.players.forEach(p=>p.voteTarget=null); 
        hostState.timerEndsAt = Date.now() + (hostState.settings.voteTime * 1000);
        hostState.autoAdvanced = false;
        syncClients(); 
        scheduleBotActions(); 
    }
    else if (action === 'host-finish-vote') window.finalizeVote();
    else if (action === 'host-next-night') { 
        let win = checkWin();
        if (win) { triggerGameOver(win); } 
        else { setupNight(); }
    }
    else if (action === 'host-restart') { 
        hostState.phase = 'LOBBY'; hostState.timerEndsAt = null; hostState.dayCount = 0;
        hostState.phantomReturns = []; hostState.skipVotes = {};
        hostState.players.forEach(p => { 
            p.isAlive=true; p.ready=false; delete p.role; 
            delete p.executionerTarget; delete p.guardianTarget;
            delete p.survivorVests; delete p.trapperCharges;
            delete p.mayorRevealed; delete p.paranoidOutcome;
            delete p.phantomDecoyUsed; delete p.dousedPlayers;
            delete p.stalkerUsed;
            delete p.saboteurActive; delete p.herbalistUsed; delete p.herbalistPotion;
            delete p.fakeDeceased; delete p.prophetAscended; delete p.prophetPrediction;
            delete p.demonSilenced; delete p.demonResurrectUsed; delete p.demonShuffleUsed; delete p.demonVoteUsed;
            delete p.vigilanteGuilt; delete p.blackmailed; delete p.sabotaged;
            delete p.infectedNight; delete p.voteTarget;
        }); 
        syncClients(); 
    }
});

render();
