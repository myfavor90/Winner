// This is a Vercel Serverless Function for processing VTU payments
// Deploy this to connect to real VTU providers like VTpass, Wama, etc.

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { service, network, phone, amount, userId } = req.body;
    
    // Your VTU API credentials
    // Sign up at: https://vtpass.com/ or https://wama.ng/
    const VTU_API_KEY = process.env.VTU_API_KEY;
    const VTU_SECRET_KEY = process.env.VTU_SECRET_KEY;
    
    // Map services to VTU API codes
    const serviceMap = {
        airtime: {
            mtn: 'MTN-VTU',
            glo: 'GLO-VTU',
            airtel: 'AIRTEL-VTU',
            '9mobile': '9MOBILE-VTU'
        },
        data: {
            mtn: 'MTN-DATA',
            glo: 'GLO-DATA',
            airtel: 'AIRTEL-DATA',
            '9mobile': '9MOBILE-DATA'
        }
    };
    
    try {
        // Example using VTpass API
        const response = await fetch('https://api-service.vtpass.com/api/pay', {
            method: 'POST',
            headers: {
                'api-key': VTU_API_KEY,
                'secret-key': VTU_SECRET_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serviceID: serviceMap[service]?.[network],
                billersCode: phone,
                variation_code: `${amount}`,
                amount: amount,
                phone: phone
            })
        });
        
        const data = await response.json();
        
        if (data.code === '000') {
            return res.status(200).json({ 
                success: true, 
                transactionId: data.transactionId,
                message: 'Purchase successful' 
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: data.response_description || 'Purchase failed' 
            });
        }
        
    } catch (error) {
        console.error('VTU API Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}
