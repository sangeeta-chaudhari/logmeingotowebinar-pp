import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  ssl:
    process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false, // This is a workaround for Omnibase as its certificate does not have the right SNI for the DNS
});

export const query = async (sql, params) => {
  let client;
  try {
    console.debug('Acquiring client from pool');
    client = await pool.connect();
  } catch (connectionError) {
    console.error('Error acquiring client from pool:', connectionError);
    throw connectionError;
  }

  try {
    // Run our custom SQL to set search_path
    console.log('Setting search_path');
    await client.query(`SET search_path TO '${process.env.PGDATABASE}',public`);
    // Run the actual SQL we want to execute
    const start = Date.now();
    const result = await client.query(sql, params);
    const duration = Date.now() - start;
    console.log('executed query', { sql, duration, rows: result.rowCount });
    // This is done in two steps so that we can catch the error and discard the connection
    return result;
  } catch (err) {
    // Release the connection back to the pool
    client.release(err);
    client = null;
    // Throw the original error so the caller gets it
    throw err;
  } finally {
    if (client) {
      // Work completed successfully so release the connection back to the pool for reuse
      client.release();
    }
  }
};

export const disconnect = async () => {
  try {
    await pool.end();
    console.log('Disconnected from PostgreSQL database');
  } catch (error) {
    console.error('Disconnect error:', error);
    throw error;
  }
};
