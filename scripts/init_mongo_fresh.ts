import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { INITIAL_PACKAGES } from '../server/db';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:PLJJR2hm602RHOZw@cluster0.cvi0qkr.mongodb.net/hhevents?retryWrites=true&w=majority';
const dbName = process.env.MONGODB_DB_NAME || 'hhevents';

async function initFreshMongo() {
  console.log(`Connecting to MongoDB Atlas (${dbName})...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas successfully.');
    const db = client.db(dbName);
    const collection = db.collection('app_state');

    const freshState = {
      _id: 'master_store',
      bookings: [], // Fresh new database: 0 customers
      packages: INITIAL_PACKAGES, // 8 official venue packages
      availabilityBlackouts: [],
      maintenance: [],
      auditLogs: [
        {
          id: 'LOG-INIT-MONGODB',
          action: 'MONGODB_CLUSTER_INIT',
          performedBy: 'system',
          targetEntity: 'database',
          targetId: 'cluster0-hhevents',
          details: 'Fresh production database successfully initialized on MongoDB Atlas with 8 official packages and 0 customer bookings.',
          timestamp: new Date().toISOString(),
        },
      ],
      settings: {
        name: 'H H Events & Conventions',
        tagline: 'Premier Convention, Wedding & Grand Event Destination',
        address: 'Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal, Karnataka 574231',
        primaryPhone: '09448133378',
        secondaryPhone: '9741575078',
        googleMapsUrl: 'https://maps.app.goo.gl/JxfruJVzpVDhxUhx6?g_st=ac',
        daySlotHours: '10:00 AM – 3:00 PM',
        eveningSlotHours: '6:00 PM – 10:00 PM',
        paymentNotice:
          'Payment and final booking arrangements are handled directly with the management. Please contact management for advance token confirmation.',
        gstNumber: '',
        panNumber: '',
        termsAndConditions: 'Standard venue guidelines apply. Advance deposit is required to confirm the reservation.',
        updatedAt: new Date().toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    };

    const result = await collection.replaceOne(
      { _id: 'master_store' as any },
      freshState,
      { upsert: true }
    );

    console.log('MongoDB initialization result:', result);

    const doc = await collection.findOne({ _id: 'master_store' as any });
    console.log('Verified MongoDB document:');
    console.log('- Database:', dbName);
    console.log('- Bookings count:', doc?.bookings?.length);
    console.log('- Packages count:', doc?.packages?.length);
    console.log('- Venue Name:', doc?.settings?.name);
    console.log('- Primary Phone:', doc?.settings?.primaryPhone);
  } catch (err) {
    console.error('Initialization error:', err);
  } finally {
    await client.close();
  }
}

initFreshMongo();
