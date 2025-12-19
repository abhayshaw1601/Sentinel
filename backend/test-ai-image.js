
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const AI_SERVICE_URL = 'http://localhost:8000';

// 1x1 Red Pixel GIF (Base64)
const dummyImage = "R0lGODlhAQABAIEAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAICTAEAOw==";

async function testImageAnalysis() {
    console.log(`Testing Image Analysis at: ${AI_SERVICE_URL}`);
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/api/analyze-medical-image`, {
            image: dummyImage,
            message: "Analyze this image",
            patientContext: {
                name: "Test Patient",
                age: 30,
                gender: "Male"
            }
        });
        console.log('Success!');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testImageAnalysis();
