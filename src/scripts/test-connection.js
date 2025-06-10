require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      family: 4
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('Successfully connected to MongoDB');
    
    // Log connection details
    console.log('\nMongoDB Connection Details:');
    console.log('- Database:', mongoose.connection.name);
    console.log('- Host:', mongoose.connection.host);
    console.log('- Port:', mongoose.connection.port);
    console.log('- State:', mongoose.connection.readyState);
    
    // Test database operations
    console.log('\nTesting database operations...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('\nConnection test completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('\nMongoDB connection error:', err);
    process.exit(1);
  }
};

testConnection(); 