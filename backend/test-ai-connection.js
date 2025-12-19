
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

console.log(`Testing connection to AI Service at: ${AI_SERVICE_URL}`);

async function testConnection() {
    try {
        const healthCheck = await axios.get(`${AI_SERVICE_URL}/health`);
        console.log('Health Check Status:', healthCheck.status);
        console.log('Health Check Data:', healthCheck.data);

        // Test Chat Endpoint (Simulated)
        console.log('\nTesting Chat Endpoint...');
        const chatResponse = await axios.post(`${AI_SERVICE_URL}/api/patient-chat`, {
            message: "Hello",
            context: {
                patient: { name: "Test Patient" }
            }
        });
        console.log('Chat Response Status:', chatResponse.status);
        console.log('Chat Response Data:', JSON.stringify(chatResponse.data, null, 2));

    } catch (error) {
        console.error('Connection Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

testConnection();
