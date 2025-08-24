const mysql = require('mysql2/promise');

async function fixLockerStatus() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'swimming_pool_db'
    });

    try {
        console.log('=== Fixing locker status enum ===');
        
        // Check current enum values
        const [currentStructure] = await connection.execute("SHOW COLUMNS FROM lockers LIKE 'status'");
        console.log('Current status column:', currentStructure[0]);
        
        // Alter table to add 'occupied' status
        await connection.execute(`
            ALTER TABLE lockers 
            MODIFY COLUMN status ENUM('available', 'maintenance', 'unavailable', 'occupied') DEFAULT 'available'
        `);
        
        console.log('✅ Successfully updated locker status enum');
        
        // Verify the change
        const [newStructure] = await connection.execute("SHOW COLUMNS FROM lockers LIKE 'status'");
        console.log('Updated status column:', newStructure[0]);
        
        // Check if there are any lockers with invalid status
        const [invalidStatus] = await connection.execute("SELECT * FROM lockers WHERE status NOT IN ('available', 'maintenance', 'unavailable', 'occupied')");
        console.log('Lockers with invalid status:', invalidStatus.length);
        
        // Update any 'occupied' status lockers if they exist
        const [occupiedLockers] = await connection.execute("SELECT * FROM lockers WHERE status = 'occupied'");
        console.log('Lockers with occupied status:', occupiedLockers.length);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

fixLockerStatus();