const {Client} = require('pg');

const PG_CONFIG = {
  host: 'localhost',
  database: 'lf8_lets_meet_db',
  user: 'user',
  password: 'secret',
};

async function runTests() {
  const client = new Client(PG_CONFIG);
  await client.connect();

  try {
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`${userCount.rows[0].count} User importiert`);

    const hobbyCount = await client.query(
      'SELECT COUNT(*) as count FROM hobbies'
    );
    console.log(`${hobbyCount.rows[0].count} verschiedene Hobbys gefunden`);

    const prefCount = await client.query(
      'SELECT COUNT(*) as count FROM user_hobby_preferences'
    );
    console.log(`${prefCount.rows[0].count} Hobby-Präferenzen importiert`);

    const userHobbyCount = await client.query(
      'SELECT COUNT(*) as count FROM user_hobbies'
    );
    console.log(
      `${userHobbyCount.rows[0].count} User-Hobby-Verknüpfungen importiert`
    );

    const likesCount = await client.query(
      'SELECT COUNT(*) as count FROM likes'
    );
    console.log(`${likesCount.rows[0].count} Likes importiert`);

    const messagesCount = await client.query(
      'SELECT COUNT(*) as count FROM messages'
    );
    console.log(`${messagesCount.rows[0].count} Nachrichten importiert`);

    const fkCheck = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM user_hobby_preferences uhp 
         LEFT JOIN users u ON uhp.user_id = u.id 
         WHERE u.id IS NULL) as invalid_user_prefs,
        (SELECT COUNT(*) FROM likes l 
         LEFT JOIN users u ON l.liker_id = u.id 
         WHERE u.id IS NULL) as invalid_likes
    `);

    const check = fkCheck.rows[0];
    console.log(`${check.invalid_user_prefs} ungültige User-Präferenzen`);
    console.log(`${check.invalid_likes} ungültige Likes\n`);

    console.log('Alle Tests abgeschlossen!');
  } catch (error) {
    console.error('Fehler beim Testen:', error.message);
  } finally {
    await client.end();
  }
}

runTests();
