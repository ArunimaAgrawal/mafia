const fs = require('fs');
const html = fs.readFileSync('mafiaweb 10.html', 'utf8');

// Match POOL_ROLES_ORDERED
let match = html.match(/const POOL_ROLES_ORDERED = \{([\s\S]*?)\};/);
if (!match) { console.log('not found'); process.exit(1); }
let poolObj;
eval('poolObj = {' + match[1] + '}');

// Match ROLES
let matchRoles = html.match(/const ROLES = \{([\s\S]*?)\};\s*\/\//);
if (!matchRoles) { console.log('roles not found'); process.exit(1); }

let rolesObj = {};
// We'll just extract the keys manually
let regex = /^\s+([A-Za-z]+):\s*\{/gm;
let m;
while ((m = regex.exec(html)) !== null) {
    rolesObj[m[1]] = true;
}

for (let team of Object.keys(poolObj)) {
    for (let r of poolObj[team]) {
        if (!rolesObj[r]) {
            console.log('MISSING ROLE:', r);
        }
    }
}
console.log('DONE');
