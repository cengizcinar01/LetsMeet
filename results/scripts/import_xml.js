const fs = require('fs/promises');
const xml2js = require('xml2js');
const {Client} = require('pg');

const PG_CONFIG = {
  host: 'localhost',
  database: 'lf8_lets_meet_db',
  user: 'user',
  password: 'secret',
};
const XML_FILE_PATH = '../../Lets_Meet_Hobbies.xml';

async function main() {
  console.log('Starte XML-Import (Hobby-Fähigkeiten)...');
  const pgClient = new Client(PG_CONFIG);
  await pgClient.connect();

  let addedCount = 0;
  let skippedCount = 0;

  try {
    // Alle Benutzer-IDs aus PostgreSQL laden, um Abfragen in der Schleife zu vermeiden
    const userRes = await pgClient.query('SELECT id, email FROM users');
    const userEmailToIdMap = new Map(
      userRes.rows.map((user) => [user.email, user.id])
    );

    // XML-Datei einlesen und parsen
    const xmlData = await fs.readFile(XML_FILE_PATH, 'utf-8');
    const result = await xml2js.parseStringPromise(xmlData);

    // Durch jeden Benutzer in der XML-Datei iterieren
    for (const user of result.users.user) {
      const email = user.email[0];
      const userId = userEmailToIdMap.get(email);

      if (!userId) continue; // Benutzer nicht gefunden, überspringen

      // Durch die Hobbys des Benutzers iterieren
      for (const hobbyName of user.hobbies[0].hobby) {
        try {
          // Hobby anlegen (falls nicht vorhanden) und ID in einem Schritt abfragen
          const hobbyRes = await pgClient.query(
            `WITH ins AS (
              INSERT INTO hobbies (name) VALUES ($1) ON CONFLICT(name) DO NOTHING RETURNING id
            )
            SELECT id FROM ins UNION ALL SELECT id FROM hobbies WHERE name = $1 LIMIT 1`,
            [hobbyName.trim()]
          );
          const hobbyId = hobbyRes.rows[0].id;

          // Benutzer und Hobby verknüpfen
          await pgClient.query(
            'INSERT INTO user_hobbies (user_id, hobby_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, hobbyId]
          );
          addedCount++;
        } catch (error) {
          if (error.code === '23505') {
            skippedCount++;
          } else {
            throw error;
          }
        }
      }
    }
    console.log(
      `XML-Import: ${addedCount} Fähigkeiten hinzugefügt (${skippedCount} übersprungen).`
    );
  } catch (error) {
    console.error(`Import fehlgeschlagen: ${error.message}`);
  } finally {
    await pgClient.end();
  }
}

main();
