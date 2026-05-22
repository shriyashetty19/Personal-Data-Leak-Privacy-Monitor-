
import fetch from 'node-fetch';

async function testAPI() {
    try {
        const response = await fetch('https://api.xposedornot.com/v1/breaches');
        const data = await response.json();
        console.log(JSON.stringify(data.exposedBreaches[0], null, 2));
    } catch (error) {
        console.error(error);
    }
}

testAPI();
