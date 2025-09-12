const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'tem_aki_admin.db');

class Database {
  constructor() {
    this.db = null;
  }

  init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Erro ao conectar com o banco de dados:', err.message);
          reject(err);
        } else {
          console.log('✅ Conectado ao banco de dados SQLite.');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const queries = [
        // Tabela de usuários administradores
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Tabela de categorias
        `CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          color TEXT,
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Tabela de subcategorias
        `CREATE TABLE IF NOT EXISTS subcategories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        )`,

        // Tabela de negócios
        `CREATE TABLE IF NOT EXISTS businesses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          category_id INTEGER,
          subcategory_id INTEGER,
          phone TEXT,
          whatsapp TEXT,
          email TEXT,
          website TEXT,
          instagram TEXT,
          facebook TEXT,
          address TEXT,
          neighborhood TEXT,
          city TEXT,
          state TEXT,
          zip_code TEXT,
          latitude REAL,
          longitude REAL,
          opening_hours TEXT,
          delivery BOOLEAN DEFAULT 0,
          takeout BOOLEAN DEFAULT 0,
          dine_in BOOLEAN DEFAULT 0,
          image_url TEXT,
          logo_url TEXT,
          status TEXT DEFAULT 'pending',
          featured BOOLEAN DEFAULT 0,
          views INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id),
          FOREIGN KEY (subcategory_id) REFERENCES subcategories (id)
        )`,

        // Tabela de imagens dos negócios
        `CREATE TABLE IF NOT EXISTS business_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_id INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          is_primary BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (business_id) REFERENCES businesses (id)
        )`,

        // Tabela de logs de atividades
        `CREATE TABLE IF NOT EXISTS activity_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action TEXT NOT NULL,
          entity_type TEXT,
          entity_id INTEGER,
          details TEXT,
          ip_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`,

        // Tabela de histórico de moderação
        `CREATE TABLE IF NOT EXISTS moderation_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_id INTEGER NOT NULL,
          user_id INTEGER,
          action TEXT NOT NULL,
          previous_status TEXT,
          new_status TEXT,
          reason TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (business_id) REFERENCES businesses (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`
      ];

      let completed = 0;
      queries.forEach((query, index) => {
        this.db.run(query, (err) => {
          if (err) {
            console.error(`Erro ao criar tabela ${index + 1}:`, err.message);
            reject(err);
          } else {
            completed++;
            if (completed === queries.length) {
              console.log('✅ Todas as tabelas foram criadas com sucesso.');
              this.createDefaultAdmin().then(resolve).catch(reject);
            }
          }
        });
      });
    });
  }

  createDefaultAdmin() {
    return new Promise((resolve, reject) => {
      const bcrypt = require('bcryptjs');
      const defaultPassword = bcrypt.hashSync('admin123', 10);
      
      const query = `INSERT OR IGNORE INTO users (username, email, password, role) 
                     VALUES (?, ?, ?, ?)`;
      
      this.db.run(query, ['admin', 'admin@temakinobairro.com.br', defaultPassword, 'admin'], (err) => {
        if (err) {
          console.error('Erro ao criar usuário admin padrão:', err.message);
          reject(err);
        } else {
          console.log('✅ Usuário admin padrão criado (username: admin, password: admin123)');
          resolve();
        }
      });
    });
  }

  getDb() {
    return this.db;
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Erro ao fechar o banco de dados:', err.message);
          } else {
            console.log('Banco de dados fechado.');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();