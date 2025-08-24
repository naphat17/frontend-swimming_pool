const mysql = require('mysql2/promise');

async function debugLockers() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'swimming_pool_db'
    });

    try {
        console.log('=== Checking database tables ===');
        
        // Check if tables exist
        const [tables] = await connection.execute("SHOW TABLES LIKE '%locker%'");
        console.log('Locker-related tables:', tables);
        
        // Check system_settings table
        const [settingsTables] = await connection.execute("SHOW TABLES LIKE 'system_settings'");
        console.log('System settings table:', settingsTables);
        
        if (tables.length > 0) {
            // Check lockers table structure
            const [lockersStructure] = await connection.execute('DESCRIBE lockers');
            console.log('\n=== Lockers table structure ===');
            console.log(lockersStructure);
            
            // Check lockers data
            const [lockersData] = await connection.execute('SELECT * FROM lockers LIMIT 5');
            console.log('\n=== Lockers data (first 5) ===');
            console.log(lockersData);
            
            // Check locker_reservations table structure
            const [reservationsStructure] = await connection.execute('DESCRIBE locker_reservations');
            console.log('\n=== Locker reservations table structure ===');
            console.log(reservationsStructure);
            
            // Check locker_reservations data
            const [reservationsData] = await connection.execute('SELECT * FROM locker_reservations LIMIT 5');
            console.log('\n=== Locker reservations data (first 5) ===');
            console.log(reservationsData);
        }
        
        if (settingsTables.length > 0) {
            // Check system_settings data
            const [settingsData] = await connection.execute('SELECT * FROM system_settings');
            console.log('\n=== System settings data ===');
            console.log(settingsData);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

debugLockers();