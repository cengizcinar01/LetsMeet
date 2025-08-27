-- Wir löschen die Tabellen, falls sie bereits existieren, um das Skript mehrfach ausführen zu können.
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS friendships;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS user_hobby_preferences;
DROP TABLE IF EXISTS user_hobbies;
DROP TABLE IF EXISTS hobbies;
DROP TABLE IF EXISTS users;


-- =================================================================
-- 1. Tabellen ohne Fremdschlüssel
-- =================================================================

-- Tabelle für die Benutzer-Stammdaten
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(50),
    interested_in_gender VARCHAR(50),
    street VARCHAR(255),
    postal_code VARCHAR(10),
    city VARCHAR(100),
    phone_number VARCHAR(50),
    profile_image BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabelle für die verfügbaren Hobbys
CREATE TABLE hobbies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);


-- =================================================================
-- 2. Tabellen mit Fremdschlüsseln
-- =================================================================

-- Verknüpfungstabelle für Benutzer und ihre eigenen Hobbys (was User selbst macht)
CREATE TABLE user_hobbies (
    user_id BIGINT NOT NULL,
    hobby_id INT NOT NULL,
    
    -- Zusammengesetzter Primärschlüssel: Ein User kann ein Hobby nur einmal haben
    PRIMARY KEY (user_id, hobby_id),
    
    -- Definition der Fremdschlüssel-Beziehungen
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_hobby FOREIGN KEY(hobby_id) REFERENCES hobbies(id) ON DELETE CASCADE
);

-- Verknüpfungstabelle für Benutzer-Hobby-Präferenzen (was User bei anderen sucht)
CREATE TABLE user_hobby_preferences (
    user_id BIGINT NOT NULL,
    hobby_id INT NOT NULL,
    user_priority SMALLINT,
    
    -- Zusammengesetzter Primärschlüssel: Ein User kann eine Präferenz nur einmal haben
    PRIMARY KEY (user_id, hobby_id),
    
    -- Definition der Fremdschlüssel-Beziehungen
    CONSTRAINT fk_user_preference FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_hobby_preference FOREIGN KEY(hobby_id) REFERENCES hobbies(id) ON DELETE CASCADE
);

-- Verknüpfungstabelle für Likes zwischen Benutzern
CREATE TABLE likes (
    liker_id BIGINT NOT NULL,
    liked_id BIGINT NOT NULL,
    status VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (liker_id, liked_id),
    
    CONSTRAINT fk_liker FOREIGN KEY(liker_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_liked FOREIGN KEY(liked_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Verknüpfungstabelle für Freundschaften zwischen Benutzern
CREATE TABLE friendships (
    requester_id BIGINT NOT NULL,
    addressee_id BIGINT NOT NULL,
    status VARCHAR(20),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    
    PRIMARY KEY (requester_id, addressee_id),
    
    CONSTRAINT fk_requester FOREIGN KEY(requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_addressee FOREIGN KEY(addressee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabelle für Nachrichten zwischen Benutzern
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sender FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_receiver FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabelle für zusätzliche Benutzerfotos
CREATE TABLE photos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    image_data BYTEA,
    url VARCHAR(512),
    description TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_photo FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);