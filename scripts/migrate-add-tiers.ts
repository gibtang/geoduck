import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

async function migrate() {
  try {
    await connectDB();

    console.log('🔄 Starting tier support migration...');

    // Update existing users to have 'free' tier by default
    const result = await User.updateMany(
      { tier: { $exists: false } },
      {
        $set: {
          tier: 'free',
          isAdmin: false,
        },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users to 'free' tier`);
    console.log('✅ Migration complete!');
    console.log('\n📝 Next steps:');
    console.log('1. To create your first admin user, run in MongoDB shell:');
    console.log('   db.users.findOneAndUpdate({ email: "your@email.com" }, { isAdmin: true, tier: "admin" })');
    console.log('2. Visit /admin to manage user tiers');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
