const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: './config.env' });

const createUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Check if users already exist
    const existingAdmin = await User.findOne({ email: 'admin@mlm.com' });
    const existingAbhishek = await User.findOne({ email: 'abhishek@mlm.com' });
    const existingBirendra = await User.findOne({ email: 'birendra@mlm.com' });

    // Create Admin user
    if (!existingAdmin) {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@mlm.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+919876543210',
        address: {
          street: 'Admin Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        isAdmin: true,
        isActive: true,
        level: 0,
        referralCode: 'ADMIN01'
      });
      await adminUser.save();
      console.log('✅ Created admin user');
      console.log('   Email: admin@mlm.com');
      console.log('   Password: admin123');
      console.log('   Referral Code:', adminUser.referralCode);
      console.log('   GUID:', adminUser.guid);
    } else {
      console.log('⚠️  Admin user already exists');
    }

    // Get admin user for sponsor reference
    const adminUser = existingAdmin || await User.findOne({ email: 'admin@mlm.com' });

    // Create Abhishek user
    if (!existingAbhishek) {
      const abhishekUser = new User({
        username: 'abhishek',
        email: 'abhishek@mlm.com',
        password: 'abhishek123',
        firstName: 'Abhishek',
        lastName: 'Kumar',
        phone: '+919876543211',
        address: {
          street: '123 Main Street',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India'
        },
        sponsorId: adminUser._id,
        position: 'left',
        level: 1,
        isActive: true
      });
      await abhishekUser.save();
      console.log('\n✅ Created Abhishek user');
      console.log('   Email: abhishek@mlm.com');
      console.log('   Password: abhishek123');
      console.log('   Referral Code:', abhishekUser.referralCode);
      console.log('   GUID:', abhishekUser.guid);
      console.log('   Sponsor: Admin');
    } else {
      console.log('⚠️  Abhishek user already exists');
    }

    // Create Birendra user
    if (!existingBirendra) {
      const birendraUser = new User({
        username: 'birendra',
        email: 'birendra@mlm.com',
        password: 'birendra123',
        firstName: 'Birendra',
        lastName: 'Singh',
        phone: '+919876543212',
        address: {
          street: '456 Park Avenue',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
          country: 'India'
        },
        sponsorId: adminUser._id,
        position: 'right',
        level: 1,
        isActive: true
      });
      await birendraUser.save();
      console.log('\n✅ Created Birendra user');
      console.log('   Email: birendra@mlm.com');
      console.log('   Password: birendra123');
      console.log('   Referral Code:', birendraUser.referralCode);
      console.log('   GUID:', birendraUser.guid);
      console.log('   Sponsor: Admin');
    } else {
      console.log('⚠️  Birendra user already exists');
    }

    // Update admin's network stats
    if (adminUser) {
      await adminUser.updateNetworkStats();
      console.log('\n✅ Updated admin network stats');
    }

    console.log('\n📋 Login Credentials Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('   Email: admin@mlm.com');
    console.log('   Password: admin123');
    console.log('\nAbhishek:');
    console.log('   Email: abhishek@mlm.com');
    console.log('   Password: abhishek123');
    console.log('\nBirendra:');
    console.log('   Email: birendra@mlm.com');
    console.log('   Password: birendra123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✅ Users created successfully!');

  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  createUsers();
}

module.exports = createUsers;

