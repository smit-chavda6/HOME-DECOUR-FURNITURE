const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const uri = 'mongodb+srv://smitchavda22ce_db_user:Qj83RgUaqLcam3TY@cluster0.nhobysj.mongodb.net/home-decor-furniture?appName=Cluster0';

// Define schemas
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    full_name: String
});

const productSchema = new mongoose.Schema({
    id: String,
    name: String,
    price: Number,
    description: String,
    category: String,
    image: String
});

const orderSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    user_id: mongoose.Schema.Types.ObjectId,
    total: Number,
    status: String,
    created_at: Date,
    updated_at: Date
});

const orderItemSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    order_id: mongoose.Schema.Types.ObjectId,
    product_id: mongoose.Schema.Types.ObjectId,
    name: String,
    product_name: String,
    quantity: Number,
    price: Number
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const OrderItem = mongoose.model('OrderItem', orderItemSchema);

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('✓ Connected to MongoDB');
        
        try {
            // Get or create a test user
            let testUser = await User.findOne({ username: 'testuser' });
            if (!testUser) {
                const hash = await bcrypt.hash('testuser123', 10);
                testUser = await User.create({
                    username: 'testuser',
                    email: 'testuser@homedecor.com',
                    password: hash,
                    full_name: 'Test User'
                });
                console.log('✓ Created test user');
            } else {
                console.log('✓ Test user exists');
            }
            
            // Get some products
            const products = await Product.find({}).limit(3);
            if (!products.length) {
                console.log('✗ No products found. Please seed products first!');
                process.exit(1);
            }
            
            console.log(`✓ Found ${products.length} products`);
            
            // Create test orders
            const order1 = await Order.create({
                _id: new mongoose.Types.ObjectId(),
                user_id: testUser._id,
                total: products[0].price * 2,
                status: 'delivered',
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            });
            
            await OrderItem.create({
                _id: new mongoose.Types.ObjectId(),
                order_id: order1._id,
                product_id: products[0]._id,
                name: products[0].name,
                product_name: products[0].name,
                quantity: 2,
                price: products[0].price
            });
            
            console.log('✓ Created order 1');
            
            // Create second test order
            const order2 = await Order.create({
                _id: new mongoose.Types.ObjectId(),
                user_id: testUser._id,
                total: products[1].price + products[2].price,
                status: 'delivered',
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            });
            
            await OrderItem.create({
                _id: new mongoose.Types.ObjectId(),
                order_id: order2._id,
                product_id: products[1]._id,
                name: products[1].name,
                product_name: products[1].name,
                quantity: 1,
                price: products[1].price
            });
            
            await OrderItem.create({
                _id: new mongoose.Types.ObjectId(),
                order_id: order2._id,
                product_id: products[2]._id,
                name: products[2].name,
                product_name: products[2].name,
                quantity: 1,
                price: products[2].price
            });
            
            console.log('✓ Created order 2');
            
            console.log('\n✓ Test data seeded successfully!');
            console.log('Test user credentials:');
            console.log('  Username: testuser');
            console.log('  Password: testuser123');
            console.log('\nYou can now log in and see orders in the Orders & Reviews modal.');
            
            await mongoose.connection.close();
            process.exit(0);
        } catch (err) {
            console.error('✗ Error:', err.message);
            await mongoose.connection.close();
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('✗ Connection error:', err.message);
        process.exit(1);
    });
