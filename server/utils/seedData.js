const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config({ path: './config.env' });

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

  // Create admin user
  const adminUser = new User({
    username: 'admin',
    email: 'admin@mlm.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1234567890',
    isAdmin: true,
    isActive: true,
    level: 0,
    referralCode: 'ADMIN01'
  });
  await adminUser.save();
  console.log('Created admin user');

    // Create john user only
    const users = [
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567891',
        sponsorId: adminUser._id,
        position: 'left',
        level: 1,
        referralCode: 'JOHN01'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.username}`);
    }

    // Create sample products
    const products = [
      {
        name: 'Premium Health Package',
        description: 'Complete health and wellness package with premium supplements',
        price: 299.99,
        pv: 100,
        category: 'package',
        stock: 50,
        commissionRates: {
          direct: 20,
          binary: 10,
          matching: 5
        }
      },
      {
        name: 'Basic Starter Kit',
        description: 'Essential starter kit for new members',
        price: 99.99,
        pv: 50,
        category: 'package',
        stock: 100,
        commissionRates: {
          direct: 15,
          binary: 8,
          matching: 3
        }
      },
      {
        name: 'Monthly Subscription',
        description: 'Monthly subscription to premium products',
        price: 49.99,
        pv: 25,
        category: 'subscription',
        stock: 1000,
        commissionRates: {
          direct: 10,
          binary: 5,
          matching: 2
        }
      },
      {
        name: 'Energy Booster',
        description: 'Natural energy supplement',
        price: 29.99,
        pv: 15,
        category: 'product',
        stock: 200,
        commissionRates: {
          direct: 12,
          binary: 6,
          matching: 2
        }
      }
    ];

    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
      console.log(`Created product: ${product.name}`);
    }

    console.log('✅ Seed data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@mlm.com / admin123');
    console.log('User: john@example.com / password123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
