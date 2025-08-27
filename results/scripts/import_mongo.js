const {MongoClient} = require('mongodb');
const {Client} = require('pg');

const PG_CONFIG = {
  host: 'localhost',
  database: 'lf8_lets_meet_db',
  user: 'user',
  password: 'secret',
};
const MONGO_URL = 'mongodb://localhost:27017';
const MONGO_DB_NAME = 'LetsMeet';

async function main() {
  console.log('Starte MongoDB-Import (Likes und Nachrichten)...');
  const pgClient = new Client(PG_CONFIG);
  const mongoClient = new MongoClient(MONGO_URL);

  let importedLikes = 0,
    skippedLikes = 0;
  let importedMessages = 0,
    skippedMessages = 0;

  try {
    await Promise.all([pgClient.connect(), mongoClient.connect()]);

    // Alle Benutzer-IDs aus PostgreSQL laden, um spätere Abfragen in der Schleife zu vermeiden
    const userRes = await pgClient.query('SELECT id, email FROM users');
    const userEmailToIdMap = new Map(
      userRes.rows.map((user) => [user.email, user.id])
    );

    // Alle Benutzer aus MongoDB laden
    const db = mongoClient.db(MONGO_DB_NAME);
    const mongoUsers = await db.collection('users').find({}).toArray();

    // Durch jeden MongoDB-Benutzer iterieren
    for (const mongoUser of mongoUsers) {
      const senderId = userEmailToIdMap.get(mongoUser._id);
      if (!senderId) continue; // Wenn der Sender nicht in unserer PG-DB ist, überspringen

      // Likes des Benutzers importieren
      for (const like of mongoUser.likes || []) {
        const likedId = userEmailToIdMap.get(like.liked_email);
        if (likedId) {
          const res = await pgClient.query(
            'INSERT INTO likes (liker_id, liked_id, status, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
            [senderId, likedId, like.status, like.timestamp]
          );
          res.rowCount > 0 ? importedLikes++ : skippedLikes++;
        } else {
          skippedLikes++;
        }
      }

      // Nachrichten des Benutzers importieren
      for (const message of mongoUser.messages || []) {
        const receiverId = userEmailToIdMap.get(message.receiver_email);
        if (receiverId) {
          const res = await pgClient.query(
            'INSERT INTO messages (sender_id, receiver_id, content, sent_at) VALUES ($1, $2, $3, $4) ON CONFLICT (sender_id, receiver_id, sent_at) DO NOTHING',
            [senderId, receiverId, message.message, message.timestamp]
          );
          res.rowCount > 0 ? importedMessages++ : skippedMessages++;
        } else {
          skippedMessages++;
        }
      }
    }
    console.log(
      `MongoDB-Import: ${importedLikes} Likes importiert (${skippedLikes} übersprungen), ${importedMessages} Nachrichten importiert (${skippedMessages} übersprungen).`
    );
  } catch (error) {
    console.error(`Import fehlgeschlagen: ${error.message}`);
  } finally {
    await Promise.all([pgClient.end(), mongoClient.close()]);
  }
}

main();
