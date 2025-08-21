const mysql = require('mysql2/promise');

async function addTestAnnualPayment() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'swimming_pool_db'
    });

    // Add a test annual membership payment
    const transactionId = 'ANN' + Date.now();
    await connection.execute(
      'INSERT INTO payments (user_id, amount, status, payment_method, transaction_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [1, 5000, 'completed', 'bank_transfer', transactionId]
    );

    console.log('Annual membership payment added with transaction ID:', transactionId);
    
    // Verify the payment was added
    const [rows] = await connection.execute(
      'SELECT * FROM payments WHERE transaction_id = ?',
      [transactionId]
    );
    
    console.log('Payment details:', rows[0]);
    
    await connection.end();
  } catch (error) {
    console.error('Error adding test payment:', error);
  }
}

addTestAnnualPayment();