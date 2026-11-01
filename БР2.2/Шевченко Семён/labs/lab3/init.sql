CREATE DATABASE users_db;
CREATE DATABASE restaurants_db;
CREATE DATABASE bookings_db;
\connect users_db
\i /sql/users.sql
\connect restaurants_db
\i /sql/restaurants.sql
\connect bookings_db
\i /sql/bookings.sql
