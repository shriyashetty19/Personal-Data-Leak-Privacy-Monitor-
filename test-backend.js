const axios = require('axios');

async function test() {
    try {
        const response = await axios.get('http://localhost:5000/');
        console.log('Backend response:', response.data);
    } catch (error) {
        console.error('Backend NOT reachable:', error.message);
    }
}

test();
