const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    let connection;
    
    try {
        // Connect to MySQL without specifying database
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            multipleStatements: true
        });
        
        console.log('✅ Connected to MySQL');
        
        // Check if database exists
        const [databases] = await connection.execute("SHOW DATABASES LIKE 'swimming_pool_db'");
        
        if (databases.length === 0) {
            console.log('❌ Database swimming_pool_db does not exist. Creating...');
            
            // Read and execute schema.sql
            const schemaPath = path.join(__dirname, 'api', 'database', 'schema.sql');
            const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
            
            await connection.execute(schemaSQL);
            console.log('✅ Database schema created');
            
            // Read and execute sample_data.sql
            const sampleDataPath = path.join(__dirname, 'api', 'database', 'sample_data.sql');
            const sampleDataSQL = fs.readFileSync(sampleDataPath, 'utf8');
            
            await connection.execute(sampleDataSQL);
            console.log('✅ Sample data inserted');
        } else {
            console.log('✅ Database swimming_pool_db already exists');
            
            // Switch to the database
            await connection.execute('USE swimming_pool_db');
            
            // Check if tables exist
            const [tables] = await connection.execute("SHOW TABLES");
            console.log('📋 Existing tables:', tables.map(t => Object.values(t)[0]));
            
            // Check if lockers table exists and has data
            const lockersTableExists = tables.some(t => Object.values(t)[0] === 'lockers');
            if (lockersTableExists) {
                const [lockers] = await connection.execute('SELECT COUNT(*) as count FROM lockers');
                console.log('🔒 Lockers count:', lockers[0].count);
                
                // Check locker_reservations table
                const reservationsTableExists = tables.some(t => Object.values(t)[0] === 'locker_reservations');
                if (reservationsTableExists) {
                    const [reservations] = await connection.execute('SELECT COUNT(*) as count FROM locker_reservations');
                    console.log('📅 Locker reservations count:', reservations[0].count);
                }
                
                // Check system_settings table
                const settingsTableExists = tables.some(t => Object.values(t)[0] === 'system_settings');
                if (settingsTableExists) {
                    const [settings] = await connection.execute('SELECT COUNT(*) as count FROM system_settings');
                    console.log('⚙️ System settings count:', settings[0].count);
                    
                    // Show all settings
                    const [allSettings] = await connection.execute('SELECT * FROM system_settings');
                    console.log('⚙️ All settings:', allSettings);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();