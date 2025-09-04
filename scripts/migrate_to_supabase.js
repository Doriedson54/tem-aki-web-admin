const sqlite3 = require('sqlite3').verbose();
const { supabaseService } = require('../config/supabase');
const path = require('path');
require('dotenv').config();

// Configurações
const SQLITE_DB_PATH = process.env.DB_PATH || './tem_aki_admin.db';
const BATCH_SIZE = 100;

class SupabaseMigration {
  constructor() {
    this.db = null;
    this.stats = {
      users: { migrated: 0, errors: 0 },
      categories: { migrated: 0, errors: 0 },
      subcategories: { migrated: 0, errors: 0 },
      businesses: { migrated: 0, errors: 0 },
      business_images: { migrated: 0, errors: 0 },
      activity_logs: { migrated: 0, errors: 0 },
      moderation_history: { migrated: 0, errors: 0 }
    };
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
        if (err) {
          console.error('❌ Erro ao conectar com SQLite:', err.message);
          reject(err);
        } else {
          console.log('✅ Conectado ao banco SQLite');
          resolve();
        }
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ Erro ao fechar SQLite:', err.message);
          } else {
            console.log('✅ Conexão SQLite fechada');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async getTableData(tableName) {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async migrateUsers() {
    console.log('\n👥 Migrando usuários...');
    
    try {
      const users = await this.getTableData('users');
      console.log(`   📊 Encontrados ${users.length} usuários`);

      for (const user of users) {
        try {
          const { error } = await supabaseService
            .from('users')
            .insert({
              id: user.id,
              username: user.username,
              email: user.email,
              password: user.password,
              role: user.role,
              created_at: user.created_at,
              updated_at: user.updated_at
            });

          if (error) {
            if (error.code === '23505') { // Duplicate key
              console.log(`   ⚠️  Usuário ${user.username} já existe, pulando...`);
            } else {
              throw error;
            }
          } else {
            this.stats.users.migrated++;
          }
        } catch (err) {
          console.error(`   ❌ Erro ao migrar usuário ${user.username}:`, err.message);
          this.stats.users.errors++;
        }
      }

      console.log(`   ✅ Usuários migrados: ${this.stats.users.migrated}`);
      if (this.stats.users.errors > 0) {
        console.log(`   ⚠️  Erros: ${this.stats.users.errors}`);
      }
    } catch (err) {
      console.error('❌ Erro ao migrar usuários:', err.message);
    }
  }

  async migrateCategories() {
    console.log('\n📂 Migrando categorias...');
    
    try {
      const categories = await this.getTableData('categories');
      console.log(`   📊 Encontradas ${categories.length} categorias`);

      for (const category of categories) {
        try {
          const { error } = await supabaseService
            .from('categories')
            .insert({
              id: category.id,
              name: category.name,
              description: category.description,
              icon: category.icon,
              color: category.color || '#007bff',
              is_active: category.is_active !== 0,
              created_at: category.created_at,
              updated_at: category.updated_at
            });

          if (error) {
            if (error.code === '23505') {
              console.log(`   ⚠️  Categoria ${category.name} já existe, pulando...`);
            } else {
              throw error;
            }
          } else {
            this.stats.categories.migrated++;
          }
        } catch (err) {
          console.error(`   ❌ Erro ao migrar categoria ${category.name}:`, err.message);
          this.stats.categories.errors++;
        }
      }

      console.log(`   ✅ Categorias migradas: ${this.stats.categories.migrated}`);
      if (this.stats.categories.errors > 0) {
        console.log(`   ⚠️  Erros: ${this.stats.categories.errors}`);
      }
    } catch (err) {
      console.error('❌ Erro ao migrar categorias:', err.message);
    }
  }

  async migrateSubcategories() {
    console.log('\n📁 Migrando subcategorias...');
    
    try {
      const subcategories = await this.getTableData('subcategories');
      console.log(`   📊 Encontradas ${subcategories.length} subcategorias`);

      for (const subcategory of subcategories) {
        try {
          const { error } = await supabaseService
            .from('subcategories')
            .insert({
              id: subcategory.id,
              category_id: subcategory.category_id,
              name: subcategory.name,
              description: subcategory.description,
              is_active: subcategory.is_active !== 0,
              created_at: subcategory.created_at,
              updated_at: subcategory.updated_at
            });

          if (error) {
            if (error.code === '23505') {
              console.log(`   ⚠️  Subcategoria ${subcategory.name} já existe, pulando...`);
            } else {
              throw error;
            }
          } else {
            this.stats.subcategories.migrated++;
          }
        } catch (err) {
          console.error(`   ❌ Erro ao migrar subcategoria ${subcategory.name}:`, err.message);
          this.stats.subcategories.errors++;
        }
      }

      console.log(`   ✅ Subcategorias migradas: ${this.stats.subcategories.migrated}`);
      if (this.stats.subcategories.errors > 0) {
        console.log(`   ⚠️  Erros: ${this.stats.subcategories.errors}`);
      }
    } catch (err) {
      console.error('❌ Erro ao migrar subcategorias:', err.message);
    }
  }

  async migrateBusinesses() {
    console.log('\n🏢 Migrando negócios...');
    
    try {
      const businesses = await this.getTableData('businesses');
      console.log(`   📊 Encontrados ${businesses.length} negócios`);

      for (const business of businesses) {
        try {
          const { error } = await supabaseService
            .from('businesses')
            .insert({
              id: business.id,
              name: business.name,
              description: business.description,
              phone: business.phone,
              whatsapp: business.whatsapp,
              email: business.email,
              website: business.website,
              address: business.address,
              neighborhood: business.neighborhood,
              city: business.city,
              state: business.state,
              zip_code: business.zip_code,
              latitude: business.latitude,
              longitude: business.longitude,
              category_id: business.category_id,
              subcategory_id: business.subcategory_id,
              status: business.status,
              opening_hours: business.opening_hours,
              social_media: business.social_media,
              created_at: business.created_at,
              updated_at: business.updated_at
            });

          if (error) {
            if (error.code === '23505') {
              console.log(`   ⚠️  Negócio ${business.name} já existe, pulando...`);
            } else {
              throw error;
            }
          } else {
            this.stats.businesses.migrated++;
          }
        } catch (err) {
          console.error(`   ❌ Erro ao migrar negócio ${business.name}:`, err.message);
          this.stats.businesses.errors++;
        }
      }

      console.log(`   ✅ Negócios migrados: ${this.stats.businesses.migrated}`);
      if (this.stats.businesses.errors > 0) {
        console.log(`   ⚠️  Erros: ${this.stats.businesses.errors}`);
      }
    } catch (err) {
      console.error('❌ Erro ao migrar negócios:', err.message);
    }
  }

  async migrateBusinessImages() {
    console.log('\n🖼️  Migrando imagens de negócios...');
    
    try {
      const images = await this.getTableData('business_images');
      console.log(`   📊 Encontradas ${images.length} imagens`);
      console.log(`   ⚠️  ATENÇÃO: As imagens precisarão ser re-uploadadas para o Supabase Storage`);

      for (const image of images) {
        try {
          // Nota: As URLs das imagens precisarão ser atualizadas manualmente
          // pois as imagens locais precisam ser migradas para o Supabase Storage
          const { error } = await supabaseService
            .from('business_images')
            .insert({
              id: image.id,
              business_id: image.business_id,
              image_url: image.image_url, // Manter URL original por enquanto
              alt_text: image.alt_text,
              is_primary: image.is_primary !== 0,
              created_at: image.created_at,
              updated_at: image.updated_at
            });

          if (error) {
            if (error.code === '23505') {
              console.log(`   ⚠️  Imagem ID ${image.id} já existe, pulando...`);
            } else {
              throw error;
            }
          } else {
            this.stats.business_images.migrated++;
          }
        } catch (err) {
          console.error(`   ❌ Erro ao migrar imagem ID ${image.id}:`, err.message);
          this.stats.business_images.errors++;
        }
      }

      console.log(`   ✅ Imagens migradas: ${this.stats.business_images.migrated}`);
      if (this.stats.business_images.errors > 0) {
        console.log(`   ⚠️  Erros: ${this.stats.business_images.errors}`);
      }
    } catch (err) {
      console.error('❌ Erro ao migrar imagens:', err.message);
    }
  }

  async migrateActivityLogs() {
    console.log('\n📋 Migrando logs de atividade...');
    
    try {
      const logs = await this.getTableData('activity_logs');
      console.log(`   📊 Encontrados ${logs.length} logs`);

      // Migrar em lotes para evitar sobrecarga
      for (let i = 0; i < logs.length; i += BATCH_SIZE) {
        const batch = logs.slice(i, i + BATCH_SIZE);
        
        try {
          const { error } = await supabaseService
            .from('activity_logs')
            .insert(batch.map(log => ({
              id: log.id,
              user_id: log.user_id,
              action: log.action,
              details: log.details,
              ip_address: log.ip_address,
              created_at: log.created_at
            })));

          if (error) {
            throw error;
          } else {
            this.stats.activity_logs.migrated += batch.length;
          }
        } catch (err) {
          console.error(`   ❌ Erro ao migrar lote de logs:`, err.message);
          this.stats.activity_logs.errors += batch.length;
        }
        
        // Pequena pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`   ✅ Logs migrados: ${this.stats.activity_logs.migrated}`);
      if (this.stats.activity_logs.errors > 0) {
        console.log(`   ⚠️  Erros: ${this.stats.activity_logs.errors}`);
      }
    } catch (err) {
      console.error('❌ Erro ao migrar logs:', err.message);
    }
  }

  async migrateModerationHistory() {
    console.log('\n⚖️  Migrando histórico de moderação...');
    
    try {
      const history = await this.getTableData('moderation_history');
      console.log(`   📊 Encontrados ${history.length} registros`);

      for (const record of history) {
        try {
          const { error } = await supabaseService
            .from('moderation_history')
            .insert({
              id: record.id,
              business_id: record.business_id,
              user_id: record.user_id,
              previous_status: record.previous_status,
              new_status: record.new_status,
              reason: record.reason,
              created_at: record.created_at
            });

          if (error) {
            if (error.code === '23505') {
              console.log(`   ⚠️  Registro ID ${record.id} já existe, pulando...`);
            } else {
              throw error;
            }
          } else {
            this.stats.moderation_history.migrated++;
          }
        } catch (err) {
          console.error(`   ❌ Erro ao migrar registro ID ${record.id}:`, err.message);
          this.stats.moderation_history.errors++;
        }
      }

      console.log(`   ✅ Registros migrados: ${this.stats.moderation_history.migrated}`);
      if (this.stats.moderation_history.errors > 0) {
        console.log(`   ⚠️  Erros: ${this.stats.moderation_history.errors}`);
      }
    } catch (err) {
      console.error('❌ Erro ao migrar histórico:', err.message);
    }
  }

  async run() {
    console.log('🚀 Iniciando migração do SQLite para Supabase...');
    console.log(`📂 Banco SQLite: ${SQLITE_DB_PATH}`);
    console.log(`🌐 Supabase URL: ${process.env.SUPABASE_URL}`);
    
    try {
      await this.init();
      
      // Executar migrações na ordem correta (respeitando foreign keys)
      await this.migrateUsers();
      await this.migrateCategories();
      await this.migrateSubcategories();
      await this.migrateBusinesses();
      await this.migrateBusinessImages();
      await this.migrateActivityLogs();
      await this.migrateModerationHistory();
      
      // Resumo final
      console.log('\n📊 RESUMO DA MIGRAÇÃO:');
      console.log('========================');
      
      let totalMigrated = 0;
      let totalErrors = 0;
      
      Object.entries(this.stats).forEach(([table, stats]) => {
        console.log(`${table.padEnd(20)}: ${stats.migrated.toString().padStart(4)} migrados, ${stats.errors.toString().padStart(4)} erros`);
        totalMigrated += stats.migrated;
        totalErrors += stats.errors;
      });
      
      console.log('========================');
      console.log(`TOTAL:               ${totalMigrated.toString().padStart(4)} migrados, ${totalErrors.toString().padStart(4)} erros`);
      
      if (totalErrors === 0) {
        console.log('\n✅ Migração concluída com sucesso!');
      } else {
        console.log('\n⚠️  Migração concluída com alguns erros. Verifique os logs acima.');
      }
      
      console.log('\n📝 PRÓXIMOS PASSOS:');
      console.log('1. Verifique os dados migrados no painel do Supabase');
      console.log('2. Re-faça upload das imagens para o Supabase Storage');
      console.log('3. Atualize as URLs das imagens na tabela business_images');
      console.log('4. Teste todas as funcionalidades do sistema');
      console.log('5. Configure as políticas RLS se necessário');
      
    } catch (err) {
      console.error('❌ Erro durante a migração:', err.message);
    } finally {
      await this.close();
    }
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  const migration = new SupabaseMigration();
  migration.run().catch(console.error);
}

module.exports = SupabaseMigration;