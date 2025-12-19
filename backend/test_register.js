import axios from 'axios';

const testRegister = async () => {
    try {
        const response = await axios.post('http://localhost:8000/api/auth/register', {
            name: 'Test Admin',
            email: 'admin_test_1@gmail.com', // Unique email
            password: 'password123',
            phone: '1234567890'
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Full Error:', error.toJSON ? error.toJSON() : error);
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
};

testRegister();
