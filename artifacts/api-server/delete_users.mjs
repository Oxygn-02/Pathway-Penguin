import Database from 'better-sqlite3';
const db = new Database('./data/db.sqlite');
const found = db.prepare("SELECT id, username FROM users WHERE LOWER(username) IN ('pippy', 'example')").all();
console.log('Found:', JSON.stringify(found));
const result = db.prepare("DELETE FROM users WHERE LOWER(username) IN ('pippy', 'example')").run();
console.log('Deleted:', result.changes, 'row(s)');
db.close();
