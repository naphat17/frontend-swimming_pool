const mysql = require('mysql2/promise');

async function debugReportsData() {
    let connection;
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'swimming_pool_db',
            port: process.env.DB_PORT || 3306
        });
        
        console.log('✓ Connected to database');
        
        // Check if tables exist and have data
        const tables = ['users', 'reservations', 'payments', 'memberships', 'membership_types', 'lockers', 'locker_reservations'];
        
        for (const table of tables) {
            try {
                const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`${table}: ${rows[0].count} records`);
            } catch (error) {
                console.log(`${table}: Table not found or error - ${error.message}`);
            }
        }
        
        console.log('\n--- Detailed Data Check ---');
        
        // Check users table
        try {
            const [users] = await connection.execute(`
                SELECT role, status, COUNT(*) as count 
                FROM users 
                GROUP BY role, status
            `);
            console.log('Users by role and status:');
            users.forEach(row => {
                console.log(`  ${row.role} (${row.status}): ${row.count}`);
            });
        } catch (error) {
            console.log('Error checking users:', error.message);
        }
        
        // Check reservations table
        try {
            const [reservations] = await connection.execute(`
                SELECT status, COUNT(*) as count 
                FROM reservations 
                GROUP BY status
            `);
            console.log('\nReservations by status:');
            reservations.forEach(row => {
                console.log(`  ${row.status}: ${row.count}`);
            });
        } catch (error) {
            console.log('Error checking reservations:', error.message);
        }
        
        // Check payments table
        try {
            const [payments] = await connection.execute(`
                SELECT status, payment_method, COUNT(*) as count, SUM(amount) as total 
                FROM payments 
                GROUP BY status, payment_method
            `);
            console.log('\nPayments by status and method:');
            payments.forEach(row => {
                console.log(`  ${row.status} (${row.payment_method}): ${row.count} payments, ${row.total} total`);
            });
        } catch (error) {
            console.log('Error checking payments:', error.message);
        }
        
        // Check memberships table
        try {
            const [memberships] = await connection.execute(`
                SELECT status, COUNT(*) as count 
                FROM memberships 
                GROUP BY status
            `);
            console.log('\nMemberships by status:');
            memberships.forEach(row => {
                console.log(`  ${row.status}: ${row.count}`);
            });
        } catch (error) {
            console.log('Error checking memberships:', error.message);
        }
        
        // Check membership_types table
        try {
            const [membershipTypes] = await connection.execute(`
                SELECT name, price, duration_months 
                FROM membership_types
            `);
            console.log('\nMembership types:');
            membershipTypes.forEach(row => {
                console.log(`  ${row.name}: ${row.price} THB, ${row.duration_months} months`);
            });
        } catch (error) {
            console.log('Error checking membership_types:', error.message);
        }
        
        console.log('\n--- Testing Reports Queries ---');
        
        // Test usage stats query
        try {
            const [usageStats] = await connection.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM reservations WHERE status IN ('confirmed', 'pending')) as totalReservations,
                    (SELECT COUNT(*) FROM users WHERE role = 'user') as totalMembers,
                    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as totalRevenue,
                    (SELECT COUNT(*) FROM users WHERE role = 'user' AND status = 'active') as activeUsers
            `);
            console.log('Usage Stats Query Result:', usageStats[0]);
        } catch (error) {
            console.log('Error in usage stats query:', error.message);
        }
        
        // Test membership stats query
        try {
            const [membershipStats] = await connection.execute(`
                SELECT 
                    mt.name,
                    COUNT(m.id) as count,
                    ROUND((COUNT(m.id) * 100.0 / (SELECT COUNT(*) FROM memberships WHERE status = 'active')), 2) as percentage
                FROM membership_types mt
                LEFT JOIN memberships m ON mt.id = m.membership_type_id AND m.status = 'active'
                GROUP BY mt.id, mt.name
                ORDER BY count DESC
            `);
            console.log('\nMembership Stats Query Result:');
            membershipStats.forEach(row => {
                console.log(`  ${row.name}: ${row.count} (${row.percentage}%)`);
            });
        } catch (error) {
            console.log('Error in membership stats query:', error.message);
        }
        
    } catch (error) {
        console.error('Database connection error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

debugReportsData();