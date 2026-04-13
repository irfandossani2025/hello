'use strict';

require('dotenv').config();

var bcrypt = require('bcryptjs');
var models = require('./models/index');

async function seed() {
  try {
    console.log('Connecting to database...');
    await models.sequelize.authenticate();
    console.log('Syncing tables...');
    await models.sequelize.sync({ alter: false, force: false });

    // Create admin user
    var adminExists = await models.User.findOne({ where: { email: 'admin@giftingcrm.com' } });
    if (!adminExists) {
      var hash = await bcrypt.hash('Admin@123', 10);
      await models.User.create({
        name: 'System Admin',
        email: 'admin@giftingcrm.com',
        password: hash,
        role: 'admin',
        active: true
      });
      console.log('✓ Admin user created:');
      console.log('  Email:    admin@giftingcrm.com');
      console.log('  Password: Admin@123');
      console.log('  >> CHANGE THIS PASSWORD AFTER FIRST LOGIN <<');
    } else {
      console.log('Admin user already exists');
    }

    // Sample products
    var productCount = await models.Product.count();
    if (productCount === 0) {
      await models.Product.bulkCreate([
        { name: 'Branded Mug', sku: 'MUG-001', description: 'Ceramic mug with custom logo', unit_price: 250, category: 'Drinkware', unit: 'piece' },
        { name: 'Notebook A5', sku: 'NB-001', description: 'Hardcover A5 notebook with branding', unit_price: 180, category: 'Stationery', unit: 'piece' },
        { name: 'Pen Set (3pc)', sku: 'PEN-001', description: 'Premium pen set with gift box', unit_price: 350, category: 'Stationery', unit: 'set' },
        { name: 'USB Drive 32GB', sku: 'USB-001', description: 'Branded USB drive 32GB', unit_price: 600, category: 'Tech', unit: 'piece' },
        { name: 'Tote Bag', sku: 'BAG-001', description: 'Canvas tote bag with custom print', unit_price: 300, category: 'Bags', unit: 'piece' },
        { name: 'Desk Organizer', sku: 'DESK-001', description: 'Wooden desk organizer with logo engraving', unit_price: 850, category: 'Office', unit: 'piece' }
      ]);
      console.log('✓ Sample products created');
    }

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
