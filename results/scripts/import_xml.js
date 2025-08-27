const fs = require('fs');
const xml2js = require('xml2js');
const {Client} = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'lf8_lets_meet_db',
  user: 'user',
  password: 'secret',
});

async function importXmlData() {
  await client.connect();

  // XML Datei lesen
  const xmlData = fs.readFileSync('../../Lets_Meet_Hobbies.xml', 'utf-8');
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xmlData);

  const users = result.users.user;

  for (const user of users) {
    const email = user.email[0];
    const hobbies = user.hobbies[0].hobby;

    try {
      // Existierende User finden
      const userResult = await client.query(
        'SELECT id, first_name, last_name FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        console.log(`User ${email} nicht in DB gefunden - übersprungen`);
        continue;
      }

      const userId = userResult.rows[0].id;
      const userName = `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`;

      // Hobby-Fähigkeiten verarbeiten
      for (const hobbyName of hobbies) {
        // Hobby in Master-Liste erstellen
        await client.query(
          'INSERT INTO hobbies (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [hobbyName]
        );

        // Hobby ID holen
        const hobbyResult = await client.query(
          'SELECT id FROM hobbies WHERE name = $1',
          [hobbyName]
        );
        const hobbyId = hobbyResult.rows[0].id;

        // In user_hobbies speichern
        try {
          await client.query(
            'INSERT INTO user_hobbies (user_id, hobby_id) VALUES ($1, $2)',
            [userId, hobbyId]
          );
          console.log(`Fähigkeit "${hobbyName}" zu ${userName} hinzugefügt`);
        } catch (error) {
          if (error.code === '23505') {
            console.log(
              `Fähigkeit "${hobbyName}" bereits bei ${userName} vorhanden`
            );
          } else {
            console.error(
              `Fehler bei Fähigkeit "${hobbyName}":`,
              error.message
            );
          }
        }
      }
    } catch (error) {
      console.error(`Fehler bei User ${email}:`, error.message);
    }
  }

  await client.end();
  console.log('XML-Import abgeschlossen!');
}

importXmlData();
