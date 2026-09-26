-- Три базы на три сервиса (database-per-service), у каждой свой пользователь.
-- Скрипт выполняется один раз при первом старте контейнера (пустой volume).

CREATE USER auth_user WITH PASSWORD 'auth_password';
CREATE DATABASE auth_db OWNER auth_user;

CREATE USER restaurants_user WITH PASSWORD 'restaurants_password';
CREATE DATABASE restaurants_db OWNER restaurants_user;

CREATE USER bookings_user WITH PASSWORD 'bookings_password';
CREATE DATABASE bookings_db OWNER bookings_user;
