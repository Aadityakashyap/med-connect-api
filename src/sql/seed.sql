-- password('Admin@123')
INSERT INTO users (email, password_hash, role) VALUES
('admin@medconnectapi.com', '$2b$10$yKkE1c2uJzvE5eZVvQj6EehWcL8pQf2p6q3o/7p7uR7i3vWJw8G3a', 'admin');

INSERT INTO profiles (user_id, full_name) VALUES
((SELECT id FROM users WHERE email='admin@medconnectapi.com'), 'MedConnectAPI Admin');
